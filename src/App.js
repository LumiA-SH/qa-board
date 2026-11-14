import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Plus, Search, ClipboardCheck, FolderKanban, Paperclip, X, Trash2, CheckCircle2, Clock3, AlertCircle, RefreshCw} from 'lucide-react';
import {supabase, configured} from './supabase';

const STATES = ['대기', '진행', '수정완료', '통과'];

const demoProjects = [
    {id: 'demo-1', name: '웹사이트 리뉴얼', description: '메인 및 회원 기능 점검'},
    {id: 'demo-2', name: '관리자 페이지', description: '운영 기능 점검'}
];

const demoItems = [
    {id: 'd1', project_id: 'demo-1', title: '로그인 후 메인 페이지 이동 확인', description: '정상 계정 로그인 후 대시보드 표시', status: '통과', priority: '보통', assignee: '루미아', created_at: new Date().toISOString()},
    {id: 'd2', project_id: 'demo-1', title: '모바일 메뉴 클릭 시 열림 확인', description: '375px 화면에서 메뉴 확인', status: '진행', priority: '높음', assignee: '개발', created_at: new Date().toISOString()},
    {id: 'd3', project_id: 'demo-1', title: '첨부파일 다운로드 검증', description: '파일명 및 확장자 유지', status: '대기', priority: '보통', assignee: '', created_at: new Date().toISOString()},
    {id: 'd4', project_id: 'demo-2', title: '공지사항 등록 후 목록 반영', description: '등록, 수정, 삭제 확인', status: '수정완료', priority: '높음', assignee: '개발', created_at: new Date().toISOString()}
];

export default function App() {
    const [projects, setProjects] = useState(configured ? [] : demoProjects);
    const [items, setItems] = useState(configured ? [] : demoItems);
    const [projectId, setProjectId] = useState(configured ? null : 'demo-1');
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('전체');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [modal, setModal] = useState('');
    const [draft, setDraft] = useState({title: '', description: '', assignee: '', priority: '보통', status: '대기'});
    const [files, setFiles] = useState([]);
    const demo = !configured;

    const reload = useCallback(async () => {
        if (!supabase) return;

        const [p, q] = await Promise.all([
            supabase.from('qa_projects').select('*').order('created_at', {ascending: true}),
            supabase.from('qa_items').select('*').order('created_at', {ascending: false})
        ]);

        if (p.error || q.error) {
            setMessage(p.error?.message || q.error?.message);
            return;
        }

        setProjects(p.data);
        setItems(q.data);
        setProjectId(prev => p.data.some(row => row.id === prev) ? prev : p.data[0]?.id || null);
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    useEffect(() => {
        if (!supabase) return;

        const channel = supabase.channel('qa-live')
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_projects'}, reload)
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_items'}, reload)
            .on('postgres_changes', {event: '*', schema: 'public', table: 'qa_attachments'}, () => {
                if (selected) loadFiles(selected.id);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [reload, selected]);

    async function run(action) {
        setBusy(true);
        setMessage('');

        try {
            await action();
        } catch (error) {
            setMessage(error.message || String(error));
        } finally {
            setBusy(false);
        }
    }

    async function addProject(event) {
        event.preventDefault();
        if (!draft.title.trim()) return;

        await run(async () => {
            const row = {name: draft.title.trim(), description: draft.description.trim()};

            if (demo) {
                const newProject = {...row, id: crypto.randomUUID()};
                setProjects(prev => [...prev, newProject]);
                setProjectId(newProject.id);
            } else {
                const {data, error} = await supabase.from('qa_projects').insert(row).select().single();

                if (error) throw error;

                await reload();
                setProjectId(data.id);
            }

            setModal('');
        });
    }

    async function saveItem(event) {
        event.preventDefault();
        if (!draft.title.trim() || !projectId) return;

        await run(async () => {
            const row = {
                project_id: projectId,
                title: draft.title.trim(),
                description: draft.description.trim(),
                assignee: draft.assignee.trim(),
                priority: draft.priority,
                status: draft.status
            };

            if (demo) {
                if (selected) {
                    setItems(prev => prev.map(item => item.id === selected.id ? {...item, ...row} : item));
                } else {
                    setItems(prev => [{...row, id: crypto.randomUUID(), created_at: new Date().toISOString()}, ...prev]);
                }
            } else {
                const query = selected
                    ? supabase.from('qa_items').update(row).eq('id', selected.id)
                    : supabase.from('qa_items').insert(row);

                const {error} = await query;

                if (error) throw error;

                await reload();
            }

            setSelected(null);
            setModal('');
        });
    }

    async function updateStatus(item, status) {
        await run(async () => {
            if (demo) {
                setItems(prev => prev.map(row => row.id === item.id ? {...row, status} : row));
            } else {
                const {error} = await supabase.from('qa_items').update({status}).eq('id', item.id);

                if (error) throw error;

                await reload();
            }
        });
    }

    async function removeItem() {
        if (!selected || !window.confirm('이 QA 항목을 삭제할까요?')) return;

        await run(async () => {
            if (demo) {
                setItems(prev => prev.filter(item => item.id !== selected.id));
            } else {
                const {error} = await supabase.from('qa_items').delete().eq('id', selected.id);

                if (error) throw error;

                await reload();
            }

            setSelected(null);
            setModal('');
        });
    }

    async function loadFiles(itemId) {
        if (demo) {
            setFiles([]);
            return;
        }

        const {data, error} = await supabase.from('qa_attachments')
            .select('*')
            .eq('item_id', itemId)
            .order('created_at', {ascending: false});

        if (error) {
            setMessage(error.message);
        } else {
            setFiles(data);
        }
    }

    async function uploadFile(event) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file || !selected || demo) return;

        if (file.size > 10 * 1024 * 1024) {
            setMessage('파일은 10MB 이하만 업로드할 수 있어요.');
            return;
        }

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            setMessage('PNG, JPG, WEBP 이미지만 첨부할 수 있어요.');
            return;
        }

        await run(async () => {
            const path = `${selected.id}/${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`;

            const {error: uploadError} = await supabase.storage
                .from('qa-screenshots')
                .upload(path, file, {contentType: file.type});

            if (uploadError) throw uploadError;

            const {error} = await supabase.from('qa_attachments').insert({
                item_id: selected.id,
                file_name: file.name,
                storage_path: path
            });

            if (error) {
                await supabase.storage.from('qa-screenshots').remove([path]);
                throw error;
            }

            await loadFiles(selected.id);
        });
    }

    async function openFile(file) {
        const {data, error} = await supabase.storage
            .from('qa-screenshots')
            .createSignedUrl(file.storage_path, 60);

        if (error) {
            setMessage(error.message);
            return;
        }

        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }

    function openItem(item = null) {
        setSelected(item);

        setDraft(item ? {
            title: item.title,
            description: item.description || '',
            assignee: item.assignee || '',
            priority: item.priority,
            status: item.status
        } : {
            title: '',
            description: '',
            assignee: '',
            priority: '보통',
            status: '대기'
        });

        setFiles([]);

        if (item) loadFiles(item.id);

        setModal('item');
    }

    const project = projects.find(row => row.id === projectId);
    const projectItems = items.filter(row => row.project_id === projectId);

    const visible = useMemo(() => projectItems.filter(row =>
        (filter === '전체' || row.status === filter) &&
        `${row.title} ${row.description || ''} ${row.assignee || ''}`.toLowerCase().includes(search.toLowerCase())
    ), [projectItems, filter, search]);

    const count = status => projectItems.filter(item => item.status === status).length;

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-icon"><ClipboardCheck size={23}/></span>
                    <span>QA Board<small>TEAM WORKSPACE</small></span>
                </div>

                <div className="sidebar-title">
                    프로젝트
                    <button className="icon-button" title="프로젝트 추가" onClick={() => {
                        setDraft({title: '', description: ''});
                        setModal('project');
                    }}>
                        <Plus size={17}/>
                    </button>
                </div>

                <nav>
                    {projects.map(row => (
                        <button key={row.id} className={`project-link ${projectId === row.id ? 'active' : ''}`} onClick={() => {
                            setProjectId(row.id);
                            setSearch('');
                            setFilter('전체');
                        }}>
                            <FolderKanban size={17}/>
                            <span>{row.name}</span>
                            <small>{items.filter(item => item.project_id === row.id).length}</small>
                        </button>
                    ))}
                </nav>

                {demo && (
                    <div className="sidebar-bottom">
                        <span className="demo-label">체험 모드 · 새로고침 시 초기화</span>
                    </div>
                )}
            </aside>

            <main className="main">
                <header className="topbar">
                    <div>
                        <span className="breadcrumb">워크스페이스 / 프로젝트</span>
                        <h1>{project?.name || '프로젝트를 추가해 주세요'}</h1>
                        <p>{project?.description || 'QA 작업을 관리하는 공간입니다.'}</p>
                    </div>

                    <div className="top-actions">
                        <button className="secondary" onClick={reload} title="새로고침">
                            <RefreshCw size={16}/> 새로고침
                        </button>
                        <button className="primary" onClick={() => openItem()} disabled={!projectId}>
                            <Plus size={17}/> QA 추가
                        </button>
                    </div>
                </header>

                {message && (
                    <div className="error banner">
                        {message}
                        <button onClick={() => setMessage('')}><X size={16}/></button>
                    </div>
                )}

                <section className="stats">
                    <div className="stat">
                        <span>전체 항목</span>
                        <strong>{projectItems.length}</strong>
                        <small>등록된 QA</small>
                    </div>
                    <div className="stat">
                        <span><Clock3 size={15}/> 대기</span>
                        <strong>{count('대기')}</strong>
                        <small>검수 시작 전</small>
                    </div>
                    <div className="stat">
                        <span><AlertCircle size={15}/> 진행 중</span>
                        <strong>{count('진행') + count('수정완료')}</strong>
                        <small>진행 및 수정완료</small>
                    </div>
                    <div className="stat">
                        <span><CheckCircle2 size={15}/> 통과</span>
                        <strong>{count('통과')}</strong>
                        <small>검수 완료</small>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel-header">
                        <div>
                            <h2>QA 체크리스트</h2>
                            <p>항목별 진행 상태를 확인하고 관리하세요.</p>
                        </div>

                        <div className="filters">
                            <div className="search">
                                <Search size={16}/>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="항목 또는 담당자 검색"/>
                            </div>
                            <select value={filter} onChange={e => setFilter(e.target.value)}>
                                {['전체', ...STATES].map(state => <option key={state}>{state}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                            <tr>
                                <th>QA 항목</th>
                                <th>우선순위</th>
                                <th>담당자</th>
                                <th>상태</th>
                                <th>등록일</th>
                            </tr>
                            </thead>
                            <tbody>
                            {visible.map(item => (
                                <tr key={item.id} onClick={() => openItem(item)}>
                                    <td className="item-title">
                                        {item.title}
                                        <small>{item.description || '설명 없음'}</small>
                                    </td>
                                    <td>
                                            <span className={`priority ${item.priority === '높음' ? 'high' : ''}`}>
                                                {item.priority}
                                            </span>
                                    </td>
                                    <td>{item.assignee || <span className="muted">미지정</span>}</td>
                                    <td>
                                        <select className={`status status-${STATES.indexOf(item.status)}`} value={item.status} onClick={e => e.stopPropagation()} onChange={e => {
                                            e.stopPropagation();
                                            updateStatus(item, e.target.value);
                                        }}>
                                            {STATES.map(state => <option key={state}>{state}</option>)}
                                        </select>
                                    </td>
                                    <td className="muted">{new Date(item.created_at).toLocaleDateString('ko-KR')}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {!visible.length && (
                            <div className="empty">
                                {projectId ? '표시할 QA 항목이 없습니다.' : '왼쪽에서 프로젝트를 추가해 주세요.'}
                            </div>
                        )}
                    </div>

                    <div className="panel-footer">총 {visible.length}개 항목 표시</div>
                </section>
            </main>

            {modal && (
                <div className="overlay" onMouseDown={e => {
                    if (e.target === e.currentTarget) setModal('');
                }}>
                    <div className="dialog">
                        <div className="dialog-head">
                            <div>
                                <h2>{modal === 'project' ? '새 프로젝트' : selected ? 'QA 항목 수정' : '새 QA 항목'}</h2>
                                <p>{modal === 'project' ? '프로젝트 정보를 입력하세요.' : '테스트 내용과 진행 상태를 기록하세요.'}</p>
                            </div>
                            <button className="icon-button" onClick={() => setModal('')}>
                                <X size={20}/>
                            </button>
                        </div>

                        <form onSubmit={modal === 'project' ? addProject : saveItem} className="dialog-body">
                            <label>
                                {modal === 'project' ? '프로젝트 이름' : 'QA 제목'}
                                <input value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} required maxLength={200} placeholder={modal === 'project' ? '예: 신규 홈페이지' : '예: 로그인 기능 정상 동작 확인'}/>
                            </label>

                            <label>
                                설명
                                <textarea rows="4" value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})} placeholder="상세 내용 또는 재현 방법"/>
                            </label>

                            {modal === 'item' && (
                                <>
                                    <div className="form-grid">
                                        <label>
                                            담당자
                                            <input value={draft.assignee} onChange={e => setDraft({...draft, assignee: e.target.value})} maxLength={100} placeholder="담당자 이름"/>
                                        </label>
                                        <label>
                                            우선순위
                                            <select value={draft.priority} onChange={e => setDraft({...draft, priority: e.target.value})}>
                                                <option>낮음</option>
                                                <option>보통</option>
                                                <option>높음</option>
                                            </select>
                                        </label>
                                    </div>

                                    <label>
                                        진행 상태
                                        <select value={draft.status} onChange={e => setDraft({...draft, status: e.target.value})}>
                                            {STATES.map(state => <option key={state}>{state}</option>)}
                                        </select>
                                    </label>

                                    {selected && (
                                        <div className="attachments">
                                            <strong>스크린샷</strong>
                                            {demo ? (
                                                <small>체험 모드에서는 첨부가 비활성화됩니다.</small>
                                            ) : (
                                                <>
                                                    <label className="upload">
                                                        <Paperclip size={16}/> 이미지 첨부 (최대 10MB)
                                                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadFile} disabled={busy} hidden/>
                                                    </label>
                                                    {files.map(file => (
                                                        <button type="button" key={file.id} className="file-link" onClick={() => openFile(file)}>
                                                            <Paperclip size={14}/>{file.file_name}
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {message && <div className="error">{message}</div>}

                            <div className="dialog-actions">
                                {selected && (
                                    <button type="button" className="danger" onClick={removeItem} disabled={busy}>
                                        <Trash2 size={16}/> 삭제
                                    </button>
                                )}
                                <span/>
                                <button type="button" className="secondary" onClick={() => setModal('')}>취소</button>
                                <button className="primary" disabled={busy}>
                                    {busy ? '처리 중...' : '저장하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}