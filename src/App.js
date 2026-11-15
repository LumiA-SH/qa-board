import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Plus, Search, ClipboardCheck, FolderKanban, Paperclip, X, Trash2, CheckCircle2, Clock3, AlertCircle, RefreshCw, MessageSquare, History, Pencil} from 'lucide-react';
import {supabase, configured} from './supabase';
import './collaboration.css';

const STATES = ['확인 요청', '작업 중', '재검수 요청', '반영 확인'];
const CATEGORIES = {done: '코드 반영 확인', fix: '수정 필요', setup: '데이터·설정', test: '재검증', decision: '논의 필요'};
const EMPTY_DRAFT = {title: '', description: '', assignee: '', priority: '보통', status: '확인 요청', category: 'test', group_id: '', implementation_checked: false};
const demoProjects = [{id: 'demo-1', name: 'QA 예시 프로젝트', description: 'Supabase 연결 전 체험'}];

export default function App() {
    const demo = !configured;
    const [projects, setProjects] = useState(demo ? demoProjects : []);
    const [items, setItems] = useState([]);
    const [groups, setGroups] = useState([]);
    const [projectId, setProjectId] = useState(demo ? 'demo-1' : null);
    const [selected, setSelected] = useState(null);
    const [draft, setDraft] = useState({...EMPTY_DRAFT});
    const [modal, setModal] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('전체');
    const [groupFilter, setGroupFilter] = useState('전체');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [comments, setComments] = useState([]);
    const [history, setHistory] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [author, setAuthor] = useState(() => localStorage.getItem('qa-board-author') || '');
    const [newGroup, setNewGroup] = useState('');
    const [groupName, setGroupName] = useState('');

    const reload = useCallback(async () => {
        if (!supabase) return;
        const [p, q, g] = await Promise.all([
            supabase.from('qa_projects').select('*').order('created_at'),
            supabase.from('qa_items').select('*').order('created_at', {ascending: false}),
            supabase.from('qa_groups').select('*').order('sort_order').order('created_at')
        ]);
        if (p.error || q.error || g.error) {
            setMessage(p.error?.message || q.error?.message || g.error?.message);
            return;
        }
        setProjects(p.data || []);
        setItems(q.data || []);
        setGroups(g.data || []);
        setProjectId(prev => p.data.some(row => row.id === prev) ? prev : p.data[0]?.id || null);
    }, []);

    const loadDiscussion = useCallback(async itemId => {
        if (!supabase || !itemId) return;
        const [c, h, f] = await Promise.all([
            supabase.from('qa_comments').select('*').eq('item_id', itemId).order('created_at'),
            supabase.from('qa_status_history').select('*').eq('item_id', itemId).order('created_at', {ascending: false}),
            supabase.from('qa_attachments').select('*').eq('item_id', itemId).order('created_at', {ascending: false})
        ]);
        if (c.error || h.error || f.error) setMessage(c.error?.message || h.error?.message || f.error?.message);
        else { setComments(c.data || []); setHistory(h.data || []); setFiles(f.data || []); }
    }, []);

    useEffect(() => { reload(); }, [reload]);
    useEffect(() => {
        if (!supabase) return;
        const channel = supabase.channel('qa-collaboration')
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_projects'}, reload)
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_items'}, reload)
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_groups'}, reload)
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_comments'}, payload => { if (selected?.id && (payload.new?.item_id === selected.id || payload.old?.item_id === selected.id)) loadDiscussion(selected.id); })
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_status_history'}, () => { if (selected?.id) loadDiscussion(selected.id); })
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_attachments'}, () => { if (selected?.id) loadDiscussion(selected.id); })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [reload, loadDiscussion, selected?.id]);

    async function run(action) {
        setBusy(true);
        setMessage('');
        try { await action(); } catch (error) { setMessage(error.message || String(error)); }
        finally { setBusy(false); }
    }

    function saveAuthor(value) {
        setAuthor(value);
        localStorage.setItem('qa-board-author', value);
    }

    async function createGroup(name) {
        const trimmed = name.trim();
        if (!trimmed || !projectId) return null;
        const existing = groups.find(row => row.project_id === projectId && row.name === trimmed);
        if (existing) return existing.id;
        if (demo) {
            const id = crypto.randomUUID();
            setGroups(prev => [...prev, {id, project_id: projectId, name: trimmed, sort_order: prev.length}]);
            return id;
        }
        const {data, error} = await supabase.from('qa_groups').insert({project_id: projectId, name: trimmed, sort_order: groups.length}).select().single();
        if (error) throw error;
        await reload();
        return data.id;
    }

    async function addGroup(event) {
        event.preventDefault();
        await run(async () => {
            await createGroup(groupName);
            setGroupName('');
            setModal('');
        });
    }

    async function renameGroup(group) {
        const name = window.prompt('그룹 이름 수정', group.name)?.trim();
        if (!name || name === group.name) return;
        await run(async () => {
            if (demo) setGroups(prev => prev.map(row => row.id === group.id ? {...row, name} : row));
            else {
                const {error} = await supabase.from('qa_groups').update({name}).eq('id', group.id);
                if (error) throw error;
                await reload();
            }
        });
    }

    async function addProject(event) {
        event.preventDefault();
        if (!draft.title.trim()) return;
        await run(async () => {
            const row = {name: draft.title.trim(), description: draft.description.trim()};
            if (demo) {
                const project = {...row, id: crypto.randomUUID()};
                setProjects(prev => [...prev, project]);
                setProjectId(project.id);
            } else {
                const {data, error} = await supabase.from('qa_projects').insert(row).select().single();
                if (error) throw error;
                await reload();
                setProjectId(data.id);
            }
            setModal('');
        });
    }

    async function writeHistory(itemId, oldStatus, newStatus) {
        if (demo || oldStatus === newStatus) return;
        const {error} = await supabase.from('qa_status_history').insert({item_id: itemId, author: author.trim() || '익명', old_status: oldStatus, new_status: newStatus});
        if (error) throw error;
    }

    async function saveItem(event) {
        event.preventDefault();
        if (!draft.title.trim() || !projectId) return;
        await run(async () => {
            const groupId = newGroup.trim() ? await createGroup(newGroup) : (draft.group_id || null);
            const row = {project_id: projectId, group_id: groupId, title: draft.title.trim(), description: draft.description.trim(), assignee: draft.assignee.trim(), priority: draft.priority, status: draft.status, category: draft.category, implementation_checked: draft.implementation_checked, updated_at: new Date().toISOString()};
            if (demo) {
                if (selected) setItems(prev => prev.map(item => item.id === selected.id ? {...item, ...row} : item));
                else setItems(prev => [{...row, id: crypto.randomUUID(), created_at: new Date().toISOString()}, ...prev]);
            } else if (selected) {
                const {error} = await supabase.from('qa_items').update(row).eq('id', selected.id);
                if (error) throw error;
                await writeHistory(selected.id, selected.status, row.status);
                await reload();
            } else {
                const {data, error} = await supabase.from('qa_items').insert(row).select().single();
                if (error) throw error;
                await writeHistory(data.id, null, row.status);
                await reload();
            }
            setSelected(null);
            setNewGroup('');
            setModal('');
        });
    }

    async function updateStatus(item, status) {
        await run(async () => {
            if (demo) setItems(prev => prev.map(row => row.id === item.id ? {...row, status} : row));
            else {
                const {error} = await supabase.from('qa_items').update({status, updated_at: new Date().toISOString()}).eq('id', item.id);
                if (error) throw error;
                await writeHistory(item.id, item.status, status);
                await reload();
            }
            if (selected?.id === item.id) setSelected(prev => ({...prev, status}));
        });
    }

    async function addComment(event) {
        event.preventDefault();
        if (!selected || !commentText.trim()) return;
        await run(async () => {
            const row = {item_id: selected.id, author: author.trim() || '익명', body: commentText.trim()};
            if (demo) setComments(prev => [...prev, {...row, id: crypto.randomUUID(), created_at: new Date().toISOString()}]);
            else {
                const {error} = await supabase.from('qa_comments').insert(row);
                if (error) throw error;
                await loadDiscussion(selected.id);
            }
            setCommentText('');
        });
    }

    async function removeItem() {
        if (!selected || !window.confirm('이 QA 항목과 댓글을 삭제할까요?')) return;
        await run(async () => {
            if (demo) setItems(prev => prev.filter(item => item.id !== selected.id));
            else {
                const {error} = await supabase.from('qa_items').delete().eq('id', selected.id);
                if (error) throw error;
                await reload();
            }
            setSelected(null);
            setModal('');
        });
    }

    async function uploadFile(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file || !selected || demo) return;
        if (file.size > 10 * 1024 * 1024) { setMessage('10MB 이하 파일만 첨부할 수 있어요.'); return; }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setMessage('PNG, JPG, WEBP 이미지만 첨부할 수 있어요.'); return; }
        await run(async () => {
            const path = `${selected.id}/${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`;
            const {error: uploadError} = await supabase.storage.from('qa-screenshots').upload(path, file, {contentType: file.type});
            if (uploadError) throw uploadError;
            const {error} = await supabase.from('qa_attachments').insert({item_id: selected.id, file_name: file.name, storage_path: path});
            if (error) { await supabase.storage.from('qa-screenshots').remove([path]); throw error; }
            await loadDiscussion(selected.id);
        });
    }

    async function openFile(file) {
        const {data, error} = await supabase.storage.from('qa-screenshots').createSignedUrl(file.storage_path, 60);
        if (error) { setMessage(error.message); return; }
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }

    function openItem(item = null) {
        setSelected(item);
        setDraft(item ? {title: item.title, description: item.description || '', assignee: item.assignee || '', priority: item.priority, status: item.status, category: item.category || 'test', group_id: item.group_id || '', implementation_checked: Boolean(item.implementation_checked)} : {...EMPTY_DRAFT});
        setNewGroup('');
        setComments([]);
        setHistory([]);
        setFiles([]);
        setCommentText('');
        if (item) loadDiscussion(item.id);
        setModal('item');
    }

    const project = projects.find(row => row.id === projectId);
    const projectGroups = groups.filter(row => row.project_id === projectId);
    const projectItems = items.filter(row => row.project_id === projectId);
    const groupLabel = id => projectGroups.find(row => row.id === id)?.name || '미분류';
    const visible = useMemo(() => projectItems.filter(row => (filter === '전체' || row.status === filter) && (groupFilter === '전체' || (groupFilter === '미분류' ? !row.group_id : row.group_id === groupFilter)) && `${row.title} ${row.description || ''} ${row.assignee || ''}`.toLowerCase().includes(search.toLowerCase())), [projectItems, filter, groupFilter, search]);
    const count = status => projectItems.filter(item => item.status === status).length;

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand"><span className="brand-icon"><ClipboardCheck size={23}/></span><span>QA Board<small>TEAM WORKSPACE</small></span></div>
                <div className="sidebar-title">프로젝트 <button className="icon-button" title="프로젝트 추가" onClick={() => { setDraft({...EMPTY_DRAFT}); setModal('project'); }}><Plus size={17}/></button></div>
                <nav>{projects.map(row => <button key={row.id} className={`project-link ${projectId === row.id ? 'active' : ''}`} onClick={() => { setProjectId(row.id); setSearch(''); setFilter('전체'); setGroupFilter('전체'); }}><FolderKanban size={17}/><span>{row.name}</span><small>{items.filter(item => item.project_id === row.id).length}</small></button>)}</nav>
                {demo && <div className="sidebar-bottom"><span className="demo-label">체험 모드 · 새로고침 시 초기화</span></div>}
            </aside>
            <main className="main">
                <header className="topbar"><div><span className="breadcrumb">워크스페이스 / 프로젝트</span><h1>{project?.name || '프로젝트를 추가해 주세요'}</h1><p>{project?.description || 'QA 작업을 관리하는 공간입니다.'}</p></div><div className="top-actions"><button className="secondary" onClick={reload}><RefreshCw size={16}/> 새로고침</button><button className="secondary" onClick={() => setModal('group')} disabled={!projectId}><Plus size={16}/> 그룹 추가</button><button className="primary" onClick={() => openItem()} disabled={!projectId}><Plus size={17}/> QA 추가</button></div></header>
                <div className="qa-identity"><label>내 표시 이름 <input value={author} onChange={e => saveAuthor(e.target.value)} placeholder="예: 개발 / 기획자" maxLength={80}/></label><small>로그인 없이 사용하며 댓글과 상태 변경 기록에 이 이름이 표시됩니다.</small></div>
                {message && <div className="error banner">{message}<button onClick={() => setMessage('')}><X size={16}/></button></div>}
                <section className="stats"><div className="stat"><span>전체 항목</span><strong>{projectItems.length}</strong><small>등록된 QA</small></div><div className="stat"><span><Clock3 size={15}/> 확인 요청</span><strong>{count('확인 요청') + count('대기')}</strong><small>검토 대기</small></div><div className="stat"><span><AlertCircle size={15}/> 진행 중</span><strong>{count('작업 중') + count('진행') + count('재검수 요청') + count('수정완료')}</strong><small>작업 및 재검수</small></div><div className="stat"><span><CheckCircle2 size={15}/> 반영 확인</span><strong>{count('반영 확인') + count('통과')}</strong><small>최종 확인</small></div></section>
                <section className="panel"><div className="panel-header"><div><h2>QA 체크리스트</h2><p>그룹별 항목을 수정하고 댓글로 검수 내용을 공유하세요.</p></div><div className="filters"><div className="search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="항목 또는 담당자 검색"/></div><select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}><option value="전체">전체 그룹</option><option value="미분류">미분류</option>{projectGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select><select value={filter} onChange={e => setFilter(e.target.value)}><option>전체</option>{[...new Set([...STATES, '대기', '진행', '수정완료', '통과'])].map(state => <option key={state}>{state}</option>)}</select></div></div>
                    <div className="qa-group-list">{projectGroups.map(group => <span key={group.id} className="qa-group-chip"><button onClick={() => setGroupFilter(group.id)}>{group.name}</button><button title="그룹 이름 수정" onClick={() => renameGroup(group)}><Pencil size={12}/></button></span>)}</div>
                    <div className="table-wrap"><table><thead><tr><th>QA 항목</th><th>그룹</th><th>분류 / 코드 반영</th><th>담당자</th><th>상태</th><th>등록일</th></tr></thead><tbody>{visible.map(item => <tr key={item.id} onClick={() => openItem(item)}><td className="item-title">{item.title}<small>{item.description || '설명 없음'}</small></td><td>{groupLabel(item.group_id)}</td><td><span className="priority">{CATEGORIES[item.category] || '재검증'}</span>{item.implementation_checked && <small className="qa-implemented">코드 반영 확인</small>}</td><td>{item.assignee || <span className="muted">미지정</span>}</td><td><select className={`status status-${Math.max(0, STATES.indexOf(item.status))}`} value={item.status} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateStatus(item, e.target.value); }}>{[...new Set([...STATES, item.status])].map(state => <option key={state}>{state}</option>)}</select></td><td className="muted">{new Date(item.created_at).toLocaleDateString('ko-KR')}</td></tr>)}</tbody></table>{!visible.length && <div className="empty">{projectId ? '표시할 QA 항목이 없습니다.' : '왼쪽에서 프로젝트를 추가해 주세요.'}</div>}</div><div className="panel-footer">총 {visible.length}개 항목 표시</div>
                </section>
            </main>
            {modal && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setModal(''); }}><div className="dialog qa-dialog"><div className="dialog-head"><div><h2>{modal === 'project' ? '새 프로젝트' : modal === 'group' ? '새 그룹' : selected ? 'QA 항목 수정' : '새 QA 항목'}</h2><p>{modal === 'item' ? 'QA 항목과 검수 의견을 관리합니다.' : '이름을 입력해 주세요.'}</p></div><button className="icon-button" onClick={() => setModal('')}><X size={20}/></button></div>
                {modal === 'group' ? <form className="dialog-body" onSubmit={addGroup}><label>그룹 이름<input value={groupName} onChange={e => setGroupName(e.target.value)} required maxLength={200}/></label><div className="dialog-actions"><span/><button type="button" className="secondary" onClick={() => setModal('')}>취소</button><button className="primary" disabled={busy}>추가</button></div></form> :
                <form className="dialog-body" onSubmit={modal === 'project' ? addProject : saveItem}><label>{modal === 'project' ? '프로젝트 이름' : 'QA 제목'}<input value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} required maxLength={200}/></label><label>설명 / 재현 방법<textarea rows="4" value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})}/></label>
                    {modal === 'item' && <><div className="form-grid"><label>그룹<select value={draft.group_id} onChange={e => { setDraft({...draft, group_id: e.target.value}); setNewGroup(''); }}><option value="">미분류</option>{projectGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label>새 그룹 만들기<input value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="입력하면 새 그룹 우선" maxLength={200}/></label></div><div className="form-grid"><label>담당자<input value={draft.assignee} onChange={e => setDraft({...draft, assignee: e.target.value})} maxLength={100}/></label><label>우선순위<select value={draft.priority} onChange={e => setDraft({...draft, priority: e.target.value})}><option>낮음</option><option>보통</option><option>높음</option></select></label></div><div className="form-grid"><label>QA 분류<select value={draft.category} onChange={e => setDraft({...draft, category: e.target.value})}>{Object.entries(CATEGORIES).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label><label>진행 상태<select value={draft.status} onChange={e => setDraft({...draft, status: e.target.value})}>{[...new Set([...STATES, draft.status])].map(state => <option key={state}>{state}</option>)}</select></label></div><label className="qa-checkbox"><input type="checkbox" checked={draft.implementation_checked} onChange={e => setDraft({...draft, implementation_checked: e.target.checked})}/> 코드·설정 반영 확인 (실제 QA 통과와 별개)</label>
                    {selected && <><div className="qa-source-meta">{selected.source_key && <span>원본 항목 {selected.source_key}</span>}{selected.specs && <span>명세 {selected.specs}</span>}{selected.qa_reference && <span>QA {selected.qa_reference}</span>}{selected.source_commit && <span>기준 커밋 {selected.source_commit.slice(0, 12)}</span>}</div>{Array.isArray(selected.source_refs) && selected.source_refs.length > 0 && <details className="qa-sources"><summary>코드 근거</summary>{selected.source_refs.map(path => <a key={path} href={`https://github.com/LumiA-SH/sangjonbap/blob/${selected.source_commit}/${path}`} target="_blank" rel="noreferrer">{path}</a>)}</details>}<div className="attachments"><strong>스크린샷</strong>{demo ? <small>체험 모드에서는 첨부가 비활성화됩니다.</small> : <><label className="upload"><Paperclip size={16}/> 이미지 첨부 (최대 10MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadFile} disabled={busy} hidden/></label>{files.map(file => <button type="button" key={file.id} className="file-link" onClick={() => openFile(file)}><Paperclip size={14}/>{file.file_name}</button>)}</>}</div></>}
                    </>}{message && <div className="error">{message}</div>}<div className="dialog-actions">{selected && <button type="button" className="danger" onClick={removeItem} disabled={busy}><Trash2 size={16}/> 삭제</button>}<span/><button type="button" className="secondary" onClick={() => setModal('')}>취소</button><button className="primary" disabled={busy}>{busy ? '처리 중...' : '저장하기'}</button></div></form>}
                {modal === 'item' && selected && <div className="qa-discussion"><h3><MessageSquare size={17}/> 코멘트</h3><div className="qa-comments">{comments.length ? comments.map(comment => <div className="qa-comment" key={comment.id}><div><strong>{comment.author}</strong><small>{new Date(comment.created_at).toLocaleString('ko-KR')}</small></div><p>{comment.body}</p></div>) : <p>아직 코멘트가 없습니다.</p>}</div><form onSubmit={addComment}><textarea value={commentText} onChange={e => setCommentText(e.target.value)} rows="3" placeholder="수정 내용, 확인 요청, 재검수 결과를 작성하세요." required/><button className="primary" disabled={busy || !commentText.trim()}>코멘트 등록</button></form><h3><History size={17}/> 상태 변경 이력</h3>{history.length ? history.map(entry => <div className="qa-history" key={entry.id}><strong>{entry.author}</strong> · {entry.old_status || '신규'} → {entry.new_status}<small>{new Date(entry.created_at).toLocaleString('ko-KR')}</small></div>) : <p>상태 변경 이력이 없습니다.</p>}</div>}
            </div></div>}
        </div>
    );
}
