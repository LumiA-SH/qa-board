import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {supabase} from './supabase';
import survivalChecklist from './survivalChecklistData';
import './survivalChecklist.css';

const kinds = {done: '반영 확인', fix: '수정 필요', setup: '데이터·설정', test: '재검증', decision: '논의 필요'};
const original = survivalChecklist.groups.flatMap(group => group.items.map(item => ({
    project_id: null, source_key: item.id, group_number: group.number, group_title: group.title,
    specs: group.specs, qa_reference: group.qa, kind: item.kind, title: item.title,
    detail: item.detail, initially_checked: item.checked, checked: item.checked,
    sources: group.sources, source_commit: survivalChecklist.meta.commit
})));

export default function SurvivalChecklist({projectId}) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [expanded, setExpanded] = useState({});

    const reload = useCallback(async () => {
        if (!supabase || !projectId) return;
        const {data, error} = await supabase.from('qa_checklist_items').select('*').eq('project_id', projectId).order('group_number').order('source_key');
        if (error) setMessage(error.message);
        else setRows(data || []);
    }, [projectId]);

    useEffect(() => { reload(); }, [reload]);
    useEffect(() => {
        if (!supabase || !projectId) return;
        const channel = supabase.channel('qa-checklist-' + projectId)
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_checklist_items', filter: 'project_id=eq.' + projectId}, reload)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [projectId, reload]);

    async function importChecklist() {
        if (!projectId || !supabase || !window.confirm('생존밥 QA 77개 항목을 이 프로젝트에 등록할까요? 기존 항목은 덮어쓰지 않습니다.')) return;
        setLoading(true);
        setMessage('체크리스트 등록 중...');
        try {
            for (let i = 0; i < original.length; i += 25) {
                const batch = original.slice(i, i + 25).map(item => ({...item, project_id: projectId}));
                const {error} = await supabase.from('qa_checklist_items').upsert(batch, {onConflict: 'project_id,source_key', ignoreDuplicates: true});
                if (error) throw error;
            }
            await reload();
            setMessage('77개 항목 등록 완료. 체크 상태는 Supabase에 저장됩니다.');
        } catch (error) { setMessage(error.message); }
        finally { setLoading(false); }
    }

    async function toggle(item) {
        setRows(prev => prev.map(row => row.id === item.id ? {...row, checked: !item.checked} : row));
        const {error} = await supabase.from('qa_checklist_items').update({checked: !item.checked, updated_at: new Date().toISOString()}).eq('id', item.id);
        if (error) { setMessage(error.message); await reload(); }
    }

    const counts = useMemo(() => ({
        all: rows.length, checked: rows.filter(row => row.checked).length,
        work: rows.filter(row => !row.checked && ['fix','setup'].includes(row.kind)).length,
        test: rows.filter(row => !row.checked && row.kind === 'test').length,
        decision: rows.filter(row => !row.checked && row.kind === 'decision').length
    }), [rows]);
    const visible = rows.filter(row => {
        const match = [row.title, row.detail, row.group_title, row.specs, row.qa_reference].join(' ').toLowerCase().includes(query.toLowerCase());
        return match && (filter === 'all' || (filter === 'remaining' && !row.checked) ||
            (filter === 'checked' && row.checked) || (filter === 'work' && !row.checked && ['fix','setup'].includes(row.kind)) ||
            (filter === 'test' && !row.checked && row.kind === 'test') || (filter === 'decision' && !row.checked && row.kind === 'decision'));
    });

    if (!projectId) return <div className="checklist-empty">프로젝트를 먼저 선택해 주세요.</div>;
    return <section className="checklist-page">
        <div className="checklist-heading"><div><h2>생존밥 QA 대조 체크리스트</h2><p>기준 커밋: {survivalChecklist.meta.commit}</p><p>반영 확인은 실제 플레이 QA 통과를 의미하지 않습니다.</p></div>
            {!rows.length && <button className="primary" disabled={loading} onClick={importChecklist}>{loading ? '등록 중...' : '첨부 체크리스트 77개 등록'}</button>}
        </div>
        <div className="checklist-stats"><div>전체 / 체크 <strong>{counts.checked} / {counts.all}</strong></div><div>남은 수정·설정 <strong>{counts.work}</strong></div><div>남은 재검증 <strong>{counts.test}</strong></div><div>남은 논의 <strong>{counts.decision}</strong></div></div>
        <div className="checklist-tools"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="체크리스트 검색"/>
            <select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">전체</option><option value="remaining">미완료</option><option value="checked">체크됨</option><option value="work">수정·설정</option><option value="test">재검증</option><option value="decision">논의</option></select>
            <button onClick={() => setExpanded(Object.fromEntries(survivalChecklist.groups.map(g => [g.number, true])))}>모두 펼치기</button>
            <button onClick={() => setExpanded(Object.fromEntries(survivalChecklist.groups.map(g => [g.number, false])))}>모두 접기</button>
        </div>
        {message && <p className="checklist-message">{message}</p>}
        {survivalChecklist.groups.map(group => {
            const groupRows = visible.filter(row => row.group_number === group.number);
            const totalRows = rows.filter(row => row.group_number === group.number);
            if (!groupRows.length) return null;
            const open = expanded[group.number] !== false;
            return <div className="checklist-group" key={group.number}>
                <button className="checklist-group-head" onClick={() => setExpanded(prev => ({...prev, [group.number]: !open}))}>
                    <span className="checklist-number">{String(group.number).padStart(2, '0')}</span><span className="checklist-group-title">{group.title}<small>명세 {group.specs} · QA {group.qa}</small></span>
                    <span>{totalRows.filter(row => row.checked).length} / {totalRows.length}</span><span>{open ? '−' : '+'}</span>
                </button>
                {open && <div>{groupRows.map(item => <div className="checklist-task" key={item.id}>
                    <label><input type="checkbox" checked={item.checked} onChange={() => toggle(item)}/><span><span className={'checklist-kind kind-' + item.kind}>{kinds[item.kind]}</span><strong>{item.title}</strong><small>{item.detail}</small></span></label>
                </div>)}<details className="checklist-sources"><summary>확인한 코드 근거</summary>{group.sources.map(path => <div key={path}><a href={'https://github.com/' + survivalChecklist.meta.repository + '/blob/' + survivalChecklist.meta.commit + '/' + path} target="_blank" rel="noreferrer">{path}</a></div>)}</details></div>}
            </div>;
        })}
        {!rows.length && <p className="checklist-empty">아직 등록된 체크리스트가 없습니다. 위 버튼으로 원본 항목을 가져올 수 있어요.</p>}
    </section>;
}
