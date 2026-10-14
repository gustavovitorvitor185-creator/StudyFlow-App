import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2,
  Clock3, Flame, LayoutDashboard, ListTodo, LogOut, Menu,
  Plus, Search, Send, Sparkles, Target, Timer, Trash2, X,
  PanelLeftClose, PanelLeftOpen, Play, Pause, RotateCcw,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './supabase'

type Task = {
  id: string
  name: string
  subject?: string
  due?: string
  done?: boolean
  priority?: string
}

type Subject = { id: string; name: string; color?: string }
type EventItem = { id: string; name: string; date: string }
type User = { id: string; name: string; email: string }
type Page =
  | 'Visão geral'
  | 'Tarefas'
  | 'Calendário'
  | 'Matérias'
  | 'Pomodoro'
  | 'StudyFlow AI'

const nav: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: 'Visão geral', icon: LayoutDashboard },
  { label: 'Tarefas', icon: CheckCircle2 },
  { label: 'Calendário', icon: CalendarDays },
  { label: 'Matérias', icon: BookOpen },
  { label: 'Pomodoro', icon: Timer },
  { label: 'StudyFlow AI', icon: Sparkles },
]

const read = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const save = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value))

const welcomeName = (name: string) => name.trim().split(/\s+/)[0] || 'estudante'

const dateLabel = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<Page>('Visão geral')
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const errorCode = new URLSearchParams(window.location.search).get('error_code')
      || hashParams.get('error_code')

    if (errorCode === 'otp_expired') {
      setAuthError('Este link expirou ou já foi usado. Solicite outro e-mail e abra o link mais recente apenas uma vez.')
    } else if (errorCode) {
      setAuthError('Não foi possível validar este link. Solicite um novo e-mail de recuperação.')
    }

    if (window.location.hash.includes('error=')) {
      window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`)
    }
  }, [])

  const getLegacyData = () => {
    const legacyTasks = read<(Task & { nome?: string })[]>('tarefasStudyFlow', []).map(task => ({
      name: task.name || task.nome || 'Tarefa sem título',
      subject: task.subject || '',
      due: task.due || null,
      done: Boolean(task.done),
      priority: task.priority || 'Normal',
    }))
    const legacySubjects = read<(Subject & { nome?: string })[]>('materiasStudyFlow', []).map(subject => ({
      name: subject.name || subject.nome || 'Matéria',
      color: subject.color || 'blue',
    }))
    const legacyEvents = read<(EventItem & { nome?: string; dia?: string })[]>('eventosStudyFlow', []).map(event => {
      const day = Number(event.dia)
      const today = new Date()
      const legacyDate =
        day > 0 && day <= 31
          ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          : ''
      return {
        name: event.name || event.nome || 'Evento',
        date: event.date || legacyDate || new Date().toISOString().slice(0, 10),
      }
    })
    return { legacyTasks, legacySubjects, legacyEvents }
  }

  const [modal, setModal] = useState<'task' | 'subject' | 'event' | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() =>
    read('studyflowSidebarCollapsed', true),
  )
  const [query, setQuery] = useState('')

  useEffect(() => {
    const client = supabase
    if (!client) {
      setAuthLoading(false)
      return
    }

    let active = true
    const loadUserData = async (userId: string) => {
      setDataLoading(true)
      setDataError('')
      setTasks([])
      setSubjects([])
      setEvents([])
      try {
        const [taskResult, subjectResult, eventResult] = await Promise.all([
          client.from('tasks').select('id,name,subject,due,done,priority').order('created_at', { ascending: false }),
          client.from('subjects').select('id,name,color').order('created_at', { ascending: false }),
          client.from('events').select('id,name,date').order('date', { ascending: true }),
        ])
        if (taskResult.error) throw taskResult.error
        if (subjectResult.error) throw subjectResult.error
        if (eventResult.error) throw eventResult.error

        let loadedTasks = (taskResult.data || []) as Task[]
        let loadedSubjects = (subjectResult.data || []) as Subject[]
        let loadedEvents = (eventResult.data || []) as EventItem[]
        const migrationKey = `studyflow-migrated-${userId}`

        if (!localStorage.getItem(migrationKey)) {
          if (!loadedTasks.length && !loadedSubjects.length && !loadedEvents.length) {
            const legacy = getLegacyData()
            if (legacy.legacyTasks.length) {
              const result = await client.from('tasks').insert(legacy.legacyTasks).select('id,name,subject,due,done,priority')
              if (result.error) throw result.error
              loadedTasks = (result.data || []) as Task[]
            }
            if (legacy.legacySubjects.length) {
              const result = await client.from('subjects').insert(legacy.legacySubjects).select('id,name,color')
              if (result.error) throw result.error
              loadedSubjects = (result.data || []) as Subject[]
            }
            if (legacy.legacyEvents.length) {
              const result = await client.from('events').insert(legacy.legacyEvents).select('id,name,date')
              if (result.error) throw result.error
              loadedEvents = (result.data || []) as EventItem[]
            }
          }
          localStorage.setItem(migrationKey, 'true')
        }

        if (active) {
          setTasks(loadedTasks)
          setSubjects(loadedSubjects)
          setEvents(loadedEvents)
        }
      } catch (error) {
        if (active) setDataError(error instanceof Error ? error.message : 'Não foi possível carregar os dados.')
      } finally {
        if (active) setDataLoading(false)
      }
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      const authUser = session?.user
      if (!authUser) {
        setUser(null)
        setTasks([])
        setSubjects([])
        setEvents([])
        setAuthLoading(false)
        return
      }
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: String(authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Estudante'),
      })
      setAuthLoading(false)
      queueMicrotask(() => { void loadUserData(authUser.id) })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileOpen])

  const completed = tasks.filter(task => task.done).length
  const filteredTasks = useMemo(
    () =>
      tasks.filter(task =>
        `${task.name} ${task.subject || ''}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [tasks, query],
  )

  const switchPage = (nextPage: Page) => {
    setPage(nextPage)
    setMobileOpen(false)
  }

  const toggleSidebar = () => {
    setCollapsed(current => {
      const next = !current
      save('studyflowSidebarCollapsed', next)
      return next
    })
  }

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') || '').trim()
    const password = String(data.get('password') || '')
    const fullName = String(data.get('name') || '').trim()
    const mode = String(data.get('mode') || 'login')
    setAuthError('')
    setAuthNotice('')
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setAuthNotice('Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.')
      } else if (mode === 'register') {
        const { data: result, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        if (!result.session) {
          setAuthNotice('Conta criada. Verifique seu e-mail e confirme o cadastro para entrar.')
        } else {
          setAuthNotice('Conta criada com sucesso!')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível autenticar.')
    }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setTasks([])
    setSubjects([])
    setEvents([])
  }

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') || '')
    const confirmation = String(form.get('passwordConfirmation') || '')
    setAuthError('')
    if (password !== confirmation) {
      setAuthError('As senhas não coincidem.')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPasswordRecovery(false)
      setAuthNotice('Senha alterada com sucesso. Entre novamente com a nova senha.')
      await supabase.auth.signOut()
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível alterar a senha.')
    }
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(item => item.id === id)
    if (!task || !supabase) return
    const { data, error } = await supabase.from('tasks').update({ done: !task.done }).eq('id', id).select('id,name,subject,due,done,priority').single()
    if (error) setDataError(error.message)
    else setTasks(current => current.map(item => item.id === id ? data as Task : item))
  }

  const deleteRecord = async (table: 'tasks' | 'subjects' | 'events', id: string) => {
    if (!supabase) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { setDataError(error.message); return }
    if (table === 'tasks') setTasks(current => current.filter(item => item.id !== id))
    if (table === 'subjects') setSubjects(current => current.filter(item => item.id !== id))
    if (table === 'events') setEvents(current => current.filter(item => item.id !== id))
  }

  const saveEntry = async (data: { name: string; date?: string; subject?: string; priority?: string; color?: string }) => {
    if (!supabase || !modal) throw new Error('Supabase não está configurado.')
    if (modal === 'task') {
      const { data: row, error } = await supabase.from('tasks').insert({ name: data.name, subject: data.subject || '', due: data.date || null, priority: data.priority || 'Normal', done: false }).select('id,name,subject,due,done,priority').single()
      if (error) throw error
      setTasks(current => [row as Task, ...current])
    } else if (modal === 'subject') {
      const { data: row, error } = await supabase.from('subjects').insert({ name: data.name, color: data.color || 'blue' }).select('id,name,color').single()
      if (error) throw error
      setSubjects(current => [row as Subject, ...current])
    } else {
      const { data: row, error } = await supabase.from('events').insert({ name: data.name, date: data.date || new Date().toISOString().slice(0, 10) }).select('id,name,date').single()
      if (error) throw error
      setEvents(current => [row as EventItem, ...current])
    }
    setDataError('')
    setModal(null)
  }

  if (!isSupabaseConfigured || !supabase) return <SetupRequired />
  if (authLoading) return <div className="auth-page"><div className="auth-card"><div className="auth-kicker"><Sparkles size={15} /> STUDYFLOW</div><h1>Conectando sua conta</h1><p className="muted">Aguarde enquanto verificamos sua sessão.</p><div className="spinner auth-spinner" /></div></div>
  if (passwordRecovery) return <PasswordRecovery onSubmit={updatePassword} error={authError} />
  if (!user) return <Auth onSubmit={signIn} error={authError} notice={authNotice} />

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="scrim"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="studyflow-sidebar"
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''}`}
      >
        <div className="sidebar-brand-row">
          <a
            className="brand"
            href="#inicio"
            title="StudyFlow"
            onClick={event => {
              event.preventDefault()
              switchPage('Visão geral')
            }}
          >
            <img className="brand-full" src="/StudyFlow.2.png" alt="StudyFlow" />
            <img className="brand-mark-img" src="/StudyFlow.png" alt="" />
          </a>
        </div>

        <div className="workspace-label">ESPAÇO DE ESTUDOS</div>

        <nav className="nav-list" aria-label="Navegação principal">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              title={label}
              className={`nav-item ${page === label ? 'active' : ''}`}
              aria-current={page === label ? 'page' : undefined}
              onClick={() => switchPage(label)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'StudyFlow AI' && <span className="nav-new">IA</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-focus">
          <div className="focus-icon"><Target size={18} /></div>
          <div>
            <b>Seu foco da semana</b>
            <p>{completed} de {tasks.length || 5} tarefas concluídas</p>
          </div>
          <div className="focus-track">
            <span style={{ width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%` }} />
          </div>
        </div>

        <button className="profile-row" onClick={signOut} title="Sair">
          <span className="avatar">{welcomeName(user.name).slice(0, 1).toUpperCase()}</span>
          <span className="profile-copy">
            <b>{user.name}</b>
            <small>Plano de estudos</small>
          </span>
          <LogOut size={16} />
        </button>
      </aside>

      <main className={`main-area ${collapsed ? 'main-collapsed' : ''}`}>
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            aria-controls="studyflow-sidebar"
          >
            <Menu size={20} />
          </button>

          <button
            className="icon-button desktop-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!collapsed}
            aria-controls="studyflow-sidebar"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>

          <div className="breadcrumb">
            Meu espaço <span>/</span> <b>{page}</b>
          </div>

          <div className="top-actions">
            <span className="today-date">{dateLabel}</span>
            <button className="user-avatar" aria-label="Perfil">
              {welcomeName(user.name).slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>

        <div className="content-wrap">
          {(dataLoading || dataError) && (
            <div className={dataError ? 'error-note' : 'data-status'} role={dataError ? 'alert' : 'status'}>
              {dataError || 'Sincronizando seus dados com segurança…'}
            </div>
          )}
          {page === 'Visão geral' && (
            <Dashboard
              user={user}
              tasks={tasks}
              subjects={subjects}
              events={events}
              completed={completed}
              onNavigate={switchPage}
              onAdd={() => setModal('task')}
              onToggle={id => { void toggleTask(id) }}
            />
          )}

          {page === 'Tarefas' && (
            <TasksPage
              tasks={filteredTasks}
              query={query}
              setQuery={setQuery}
              onAdd={() => setModal('task')}
              onToggle={id => { void toggleTask(id) }}
              onDelete={id => { void deleteRecord('tasks', id) }}
            />
          )}

          {page === 'Matérias' && (
            <SubjectsPage
              subjects={subjects}
              onAdd={() => setModal('subject')}
              onDelete={id => { void deleteRecord('subjects', id) }}
            />
          )}

          {page === 'Calendário' && (
            <CalendarPage
              events={events}
              onAdd={() => setModal('event')}
              onDelete={id => { void deleteRecord('events', id) }}
            />
          )}

          {page === 'Pomodoro' && <Pomodoro />}
          {page === 'StudyFlow AI' && <AiPage />}
        </div>
      </main>

      {modal && (
        <EntryModal
          kind={modal}
          subjects={subjects}
          onClose={() => setModal(null)}
          onSave={saveEntry}
        />
      )}
    </div>
  )
}

function Auth({ onSubmit, error, notice }: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  error: string
  notice: string
}) {
  const [register, setRegister] = useState(false)
  const [forgot, setForgot] = useState(false)
  const mode = forgot ? 'forgot' : register ? 'register' : 'login'

  return (
    <div className="auth-page">
<div className="auth-card">
        <div className="auth-kicker"><Sparkles size={15} /> APRENDA NO SEU RITMO</div>
        <h1>{forgot ? 'Recupere sua senha.' : register ? 'Comece sua jornada.' : 'Seu próximo passo começa aqui.'}</h1>
        <p className="muted">
          {forgot
            ? 'Informe seu e-mail e enviaremos um link para criar uma nova senha.'
            : 'Organize sua rotina e transforme seus objetivos em progresso real.'}
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          <input type="hidden" name="mode" value={mode} />
          {register && !forgot && (
            <label>
              Seu nome
              <input name="name" placeholder="Como podemos te chamar?" required />
            </label>
          )}
          <label>
            E-mail
            <input type="email" name="email" placeholder="voce@exemplo.com" required />
          </label>
          {!forgot && (
            <label>
              Senha
              <input
                type="password"
                name="password"
                placeholder="Mínimo de 6 caracteres"
                minLength={6}
                required
              />
            </label>
          )}
          <button className="primary-button full-button">
            {forgot ? 'Enviar link de recuperação' : register ? 'Criar minha conta' : 'Entrar na minha conta'}
            <ArrowRight size={17} />
          </button>
        </form>

        {error && <div className="error-note" role="alert">{error}</div>}
        {notice && <div className="success-note" role="status">{notice}</div>}

        <p className="auth-switch">
          {forgot ? 'Lembrou sua senha?' : register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
          <button type="button" onClick={() => {
            if (forgot) {
              setForgot(false)
            } else {
              setRegister(!register)
            }
          }}>
            {forgot || register ? 'Fazer login' : 'Criar conta'}
          </button>
        </p>

        {!register && !forgot && (
          <div className="auth-forgot">
            <button type="button" onClick={() => setForgot(true)}>Esqueci minha senha</button>
          </div>
        )}

        <div className="auth-note"><Check size={14} /> Seus dados são sincronizados com segurança na sua conta</div>
      </div>

      <span className="auth-footer">STUDYFLOW · FOCO NO QUE IMPORTA</span>
    </div>
  )
}

function PasswordRecovery({ onSubmit, error }: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  error: string
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-kicker"><Sparkles size={15} /> PROTEJA SUA CONTA</div>
        <h1>Crie uma nova senha.</h1>
        <p className="muted">Escolha uma senha segura com pelo menos 6 caracteres.</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Nova senha
            <input type="password" name="password" placeholder="Mínimo de 6 caracteres" minLength={6} autoComplete="new-password" required />
          </label>
          <label>
            Confirme a nova senha
            <input type="password" name="passwordConfirmation" placeholder="Digite a senha novamente" minLength={6} autoComplete="new-password" required />
          </label>
          {error && <div className="error-note" role="alert">{error}</div>}
          <button className="primary-button full-button">Salvar nova senha <ArrowRight size={17} /></button>
        </form>
      </div>
      <span className="auth-footer">STUDYFLOW · FOCO NO QUE IMPORTA</span>
    </div>
  )
}

function SetupRequired() {
  return (
    <div className="auth-page">
      <div className="auth-card setup-card">
        <div className="auth-kicker"><Sparkles size={15} /> CONFIGURAÇÃO NECESSÁRIA</div>
        <h1>Conecte o StudyFlow ao Supabase</h1>
        <p className="muted">Crie o arquivo <code>.env.local</code> na pasta principal do projeto com as variáveis abaixo e reinicie o servidor Vite.</p>
        <pre className="env-example">VITE_SUPABASE_URL=https://seu-projeto.supabase.co{'\n'}VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publishable</pre>
        <p className="auth-note"><Check size={14} /> Use a chave publishable (ou anon legada). Nunca coloque a chave secret ou service_role no navegador.</p>
      </div>
    </div>
  )
}

function Dashboard({
  user,
  tasks,
  subjects,
  events,
  completed,
  onNavigate,
  onAdd,
  onToggle,
}: {
  user: User
  tasks: Task[]
  subjects: Subject[]
  events: EventItem[]
  completed: number
  onNavigate: (page: Page) => void
  onAdd: () => void
  onToggle: (id: string) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = events
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0

  return (
    <>
      <div className="welcome-row">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="hero-kicker-dot" />
            <span>{dateLabel}</span>
          </div>

          <h1>
            Olá, {welcomeName(user.name)}
            <br />
            <span>vamos avançar hoje?</span>
          </h1>

          <p>Um passo de cada vez. Organize suas prioridades e continue no seu ritmo.</p>

          <button className="primary-button hero-button" onClick={onAdd}>
            <Plus size={17} /> Nova tarefa <ArrowRight size={16} />
          </button>
        </div>

        <div className="hero-progress-card">
          <div
            className="hero-progress-ring"
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
          >
            <div className="hero-progress-center">
              <Target size={19} />
              <strong>{progress}%</strong>
              <small>concluído</small>
            </div>
          </div>

          <div className="hero-progress-copy">
            <b>Seu progresso</b>
            <span>{completed} de {tasks.length} tarefas concluídas</span>
          </div>
        </div>
      </div>

      <section className="stats-grid">
        <Stat
          icon={<CheckCircle2 size={18} />}
          tint="blue"
          label="Tarefas concluídas"
          value={`${completed}/${tasks.length}`}
          detail="do seu planejamento"
        />
        <Stat
          icon={<BookOpen size={18} />}
          tint="violet"
          label="Matérias ativas"
          value={String(subjects.length).padStart(2, '0')}
          detail="no seu espaço de estudo"
        />
        <Stat
          icon={<Flame size={18} />}
          tint="orange"
          label="Sequência de estudos"
          value="3 dias"
          detail="continue nesse ritmo"
        />
        <Stat
          icon={<ListTodo size={18} />}
          tint="cyan"
          label="Tarefas em aberto"
          value={String(tasks.length - completed).padStart(2, '0')}
          detail="próximos passos do seu plano"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel task-panel">
          <div className="panel-heading">
            <div>
              <h2>Suas tarefas</h2>
              <p>O que merece sua atenção hoje</p>
            </div>
            <button className="text-button" onClick={() => onNavigate('Tarefas')}>
              Ver todas <ArrowRight size={15} />
            </button>
          </div>

          {tasks.length === 0 ? (
            <Empty
              icon={<CheckCircle2 />}
              title="Tudo começa com um plano"
              text="Adicione sua primeira tarefa para organizar os estudos."
              action="Criar tarefa"
              onAction={onAdd}
            />
          ) : (
            <div className="task-list">
              {tasks.slice(0, 5).map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => onToggle(task.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="right-stack">
          <div className="panel focus-panel">
            <div className="panel-heading">
              <div>
                <h2>Próximo compromisso</h2>
                <p>Fique de olho no que vem aí</p>
              </div>
              <CalendarDays className="subtle-icon" size={18} />
            </div>

            {upcoming ? (
              <div className="event-preview">
                <span className="event-date">
                  <b>{new Date(`${upcoming.date}T12:00:00`).getDate()}</b>
                  <small>
                    {new Intl.DateTimeFormat('pt-BR', { month: 'short' })
                      .format(new Date(`${upcoming.date}T12:00:00`))
                      .replace('.', '')}
                  </small>
                </span>
                <div>
                  <b>{upcoming.name}</b>
                  <small>
                    {new Intl.DateTimeFormat('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    }).format(new Date(`${upcoming.date}T12:00:00`))}
                  </small>
                </div>
              </div>
            ) : (
              <Empty
                icon={<CalendarDays />}
                title="Agenda livre por enquanto"
                text="Coloque suas próximas provas e entregas no calendário."
                action="Adicionar evento"
                onAction={() => onNavigate('Calendário')}
              />
            )}
          </div>

          <div className="ai-promo">
            <div className="ai-orb"><Sparkles size={19} /></div>
            <div>
              <b>Uma dúvida no caminho?</b>
              <p>Estude com apoio do StudyFlow AI.</p>
            </div>
            <button
              className="circle-arrow"
              aria-label="Abrir StudyFlow AI"
              onClick={() => onNavigate('StudyFlow AI')}
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="panel subjects-panel">
        <div className="panel-heading">
          <div>
            <h2>Seu espaço de estudo</h2>
            <p>Matérias que fazem parte da sua jornada</p>
          </div>
          <button className="text-button" onClick={() => onNavigate('Matérias')}>
            Ver matérias <ArrowRight size={15} />
          </button>
        </div>

        {subjects.length ? (
          <div className="subject-chips">
            {subjects.slice(0, 6).map((subject, index) => (
              <div className={`subject-chip color-${index % 4}`} key={subject.id}>
                <span className="subject-dot" />
                {subject.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-inline">
            Ainda não há matérias cadastradas.{' '}
            <button onClick={() => onNavigate('Matérias')}>Adicionar uma matéria</button>
          </p>
        )}
      </section>

      <section className="quick-actions-grid">
        <button
          className="quick-action-card focus-quick"
          onClick={() => onNavigate('Pomodoro')}
        >
          <span className="quick-icon"><Clock3 size={21} /></span>
          <span className="quick-copy">
            <small>HORA DE CONCENTRAR</small>
            <b>Comece uma sessão de foco</b>
            <span>Reserve um tempo para avançar nos seus estudos.</span>
          </span>
          <span className="quick-arrow"><ArrowRight size={18} /></span>
        </button>

        <button
          className="quick-action-card calendar-quick"
          onClick={() => onNavigate('Calendário')}
        >
          <span className="quick-icon"><CalendarDays size={21} /></span>
          <span className="quick-copy">
            <small>SEU PRÓXIMO PASSO</small>
            <b>Organize sua semana</b>
            <span>Consulte provas, entregas e compromissos.</span>
          </span>
          <span className="quick-arrow"><ArrowRight size={18} /></span>
        </button>
      </section>

      <footer className="page-footer">
        Feito para aprender com mais leveza <span>·</span> StudyFlow
      </footer>
    </>
  )
}

function Stat({
  icon,
  tint,
  label,
  value,
  detail,
}: {
  icon: ReactNode
  tint: string
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tint}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onDelete?: () => void
}) {
  return (
    <div className={`task-row ${task.done ? 'task-done' : ''}`}>
      <button
        className={`task-check ${task.done ? 'checked' : ''}`}
        onClick={onToggle}
        aria-label={task.done ? 'Reabrir tarefa' : 'Concluir tarefa'}
      >
        {task.done && <Check size={13} />}
      </button>
      <div className="task-copy">
        <b>{task.name}</b>
        <small>
          {task.subject || 'Estudo'}
          {task.due
            ? ` · ${new Intl.DateTimeFormat('pt-BR', {
                day: 'numeric',
                month: 'short',
              }).format(new Date(`${task.due}T12:00:00`))}`
            : ''}
        </small>
      </div>
      <span
        className={`priority ${
          task.priority === 'Alta'
            ? 'priority-high'
            : task.priority === 'Baixa'
              ? 'priority-low'
              : ''
        }`}
      >
        <i />
        {task.priority || 'Normal'}
      </span>
      {onDelete && (
        <button
          className="delete-button"
          onClick={onDelete}
          aria-label="Excluir tarefa"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}

function Empty({
  icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: ReactNode
  title: string
  text: string
  action: string
  onAction: () => void
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <b>{title}</b>
      <p>{text}</p>
      <button className="text-button" onClick={onAction}>
        {action} <ArrowRight size={14} />
      </button>
    </div>
  )
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  )
}

function TasksPage({
  tasks,
  query,
  setQuery,
  onAdd,
  onToggle,
  onDelete,
}: {
  tasks: Task[]
  query: string
  setQuery: (value: string) => void
  onAdd: () => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <PageHeader
        eyebrow="SEU PLANO, NO SEU RITMO"
        title="Tarefas"
        description="Organize o que você quer conquistar."
        action={
          <button className="primary-button" onClick={onAdd}>
            <Plus size={17} /> Nova tarefa
          </button>
        }
      />

      <div className="panel page-panel">
        <div className="list-toolbar">
          <div>
            <h2>Lista de tarefas</h2>
            <p>
              {tasks.length} {tasks.length === 1 ? 'item' : 'itens'} no seu planejamento
            </p>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input
              placeholder="Buscar tarefa"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
        </div>

        {tasks.length ? (
          <div className="task-list">
            {tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => onToggle(task.id)}
                onDelete={() => onDelete(task.id)}
              />
            ))}
          </div>
        ) : (
          <Empty
            icon={<CheckCircle2 />}
            title={query ? 'Nenhum resultado encontrado' : 'Sua lista está pronta para começar'}
            text={
              query
                ? 'Tente buscar por outro termo.'
                : 'Crie uma tarefa e tenha clareza sobre seu próximo passo.'
            }
            action={query ? 'Limpar busca' : 'Criar tarefa'}
            onAction={query ? () => setQuery('') : onAdd}
          />
        )}
      </div>
    </>
  )
}

function SubjectsPage({
  subjects,
  onAdd,
  onDelete,
}: {
  subjects: Subject[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <PageHeader
        eyebrow="APRENDIZADO ORGANIZADO"
        title="Matérias"
        description="Reúna seus conteúdos em um só lugar."
        action={
          <button className="primary-button" onClick={onAdd}>
            <Plus size={17} /> Nova matéria
          </button>
        }
      />

      {subjects.length ? (
        <div className="subject-grid">
          {subjects.map((subject, index) => (
            <article className="panel subject-card" key={subject.id}>
              <div className={`subject-art color-${index % 4}`}>
                <BookOpen size={22} />
                <button
                  className="delete-button"
                  onClick={() => onDelete(subject.id)}
                  aria-label={`Excluir ${subject.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h2>{subject.name}</h2>
              <p>Uma matéria por vez. Um passo de cada vez.</p>
              <div className="subject-progress">
                <span style={{ width: '28%' }} />
              </div>
              <small>Seu espaço de aprendizado</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel page-panel">
          <Empty
            icon={<BookOpen />}
            title="Seu conhecimento começa aqui"
            text="Adicione as matérias que você está estudando para manter tudo organizado."
            action="Adicionar matéria"
            onAction={onAdd}
          />
        </div>
      )}
    </>
  )
}

function CalendarPage({
  events,
  onAdd,
  onDelete,
}: {
  events: EventItem[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <PageHeader
        eyebrow="OLHE PARA FRENTE"
        title="Calendário"
        description="Provas, entregas e momentos importantes."
        action={
          <button className="primary-button" onClick={onAdd}>
            <Plus size={17} /> Novo evento
          </button>
        }
      />

      <div className="panel page-panel">
        <div className="list-toolbar">
          <div>
            <h2>Próximos eventos</h2>
            <p>Não deixe um prazo importante passar.</p>
          </div>
          <CalendarDays size={20} className="subtle-icon" />
        </div>

        {sorted.length ? (
          <div className="event-list">
            {sorted.map(event => (
              <div className="event-row" key={event.id}>
                <span className="event-date">
                  <b>{new Date(`${event.date}T12:00:00`).getDate()}</b>
                  <small>
                    {new Intl.DateTimeFormat('pt-BR', { month: 'short' })
                      .format(new Date(`${event.date}T12:00:00`))
                      .replace('.', '')}
                  </small>
                </span>
                <div className="task-copy">
                  <b>{event.name}</b>
                  <small>
                    {new Intl.DateTimeFormat('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(`${event.date}T12:00:00`))}
                  </small>
                </div>
                <button
                  className="delete-button"
                  onClick={() => onDelete(event.id)}
                  aria-label="Excluir evento"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            icon={<CalendarDays />}
            title="Seu calendário está livre"
            text="Adicione uma prova, entrega ou sessão de estudos."
            action="Adicionar evento"
            onAction={onAdd}
          />
        )}
      </div>
    </>
  )
}

function Pomodoro() {
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<'Foco' | 'Pausa curta' | 'Pausa longa'>('Foco')

  useEffect(() => {
    if (!running) return

    const timer = window.setInterval(() => {
      setSeconds(current => {
        if (current <= 1) {
          setRunning(false)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [running])

  const changeMode = (nextMode: typeof mode) => {
    setMode(nextMode)
    setRunning(false)
    setSeconds(
      nextMode === 'Foco'
        ? 25 * 60
        : nextMode === 'Pausa curta'
          ? 5 * 60
          : 15 * 60,
    )
  }

  const totalSeconds =
    mode === 'Foco' ? 1500 : mode === 'Pausa curta' ? 300 : 900
  const progress = 1 - seconds / totalSeconds

  return (
    <>
      <PageHeader
        eyebrow="TEMPO DE QUALIDADE"
        title="Pomodoro"
        description="Faça pausas intencionais. Proteja seu foco."
      />

      <div className="panel pomodoro-panel">
        <div className="timer-tabs">
          {(['Foco', 'Pausa curta', 'Pausa longa'] as const).map(item => (
            <button
              key={item}
              className={mode === item ? 'selected' : ''}
              onClick={() => changeMode(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div
          className={`timer-face ${running ? 'timer-running' : ''}`}
          style={{ '--progress': `${progress * 100}%` } as React.CSSProperties}
        >
          <div className="timer-inner">
            <span>
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:
              {String(seconds % 60).padStart(2, '0')}
            </span>
            <small>{running ? 'VOCÊ ESTÁ NO FLUXO' : 'UM PASSO DE CADA VEZ'}</small>
          </div>
        </div>

        <div className="timer-controls">
          <button
            className="primary-button"
            onClick={() => setRunning(true)}
            disabled={running}
          >
            <Play size={16} /> Iniciar
          </button>
          <button
            className="secondary-button"
            onClick={() => setRunning(false)}
            disabled={!running}
          >
            <Pause size={16} /> Pausar
          </button>
          <button
            className="timer-reset-button"
            onClick={() => {
              setRunning(false)
              setSeconds(totalSeconds)
            }}
          >
            <RotateCcw size={16} /> Reiniciar
          </button>
        </div>

        <p className="timer-hint">
          <Clock3 size={15} /> 25 minutos de foco · 5 minutos de pausa
        </p>
      </div>
    </>
  )
}

function AiPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError('')
    setAnswer('')

    try {
      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: question }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.erro || 'Não foi possível obter uma resposta.')
      }

      setAnswer(data.resposta)
    } catch {
      setError(
        'Não conseguimos acessar o assistente. Confira se o servidor da IA está ativo e tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="APRENDER TAMBÉM É PERGUNTAR"
        title="StudyFlow AI"
        description="Uma ajuda para destravar sua próxima descoberta."
      />

      <div className="panel ai-panel">
        <div className="ai-welcome">
          <div className="ai-big-icon"><Sparkles size={24} /></div>
          <h2>Em que posso te ajudar?</h2>
          <p>
            Converse sobre um conteúdo, peça um exemplo ou entenda um exercício
            passo a passo.
          </p>
        </div>

        <div className="suggestions">
          <button onClick={() => setQuestion('Explique fotossíntese de um jeito simples')}>
            Explique um conteúdo <ArrowRight size={14} />
          </button>
          <button onClick={() => setQuestion('Como posso organizar meus estudos para uma prova?')}>
            Organize meus estudos <ArrowRight size={14} />
          </button>
          <button onClick={() => setQuestion('Me ajude a resolver uma equação do segundo grau')}>
            Resolva um exercício <ArrowRight size={14} />
          </button>
        </div>

        {answer && (
          <div className="ai-answer">
            <div className="answer-avatar"><Sparkles size={15} /></div>
            <div><b>StudyFlow AI</b><p>{answer}</p></div>
          </div>
        )}

        {error && <div className="error-note">{error}</div>}

        <form className="ai-input" onSubmit={ask}>
          <textarea
            value={question}
            onChange={event => setQuestion(event.target.value)}
            placeholder="Escreva sua pergunta..."
            rows={2}
          />
          <button
            className="send-button"
            disabled={loading || !question.trim()}
            aria-label="Enviar pergunta"
          >
            {loading ? <span className="spinner" /> : <Send size={17} />}
          </button>
        </form>

        <p className="ai-disclaimer">
          A IA pode cometer erros. Confira informações importantes com seus materiais de estudo.
        </p>
      </div>
    </>
  )
}

function EntryModal({
  kind,
  subjects,
  onClose,
  onSave,
}: {
  kind: 'task' | 'subject' | 'event'
  subjects: Subject[]
  onClose: () => void
  onSave: (data: {
    name: string
    date?: string
    subject?: string
    priority?: string
    color?: string
  }) => Promise<void>
}) {
  const isTask = kind === 'task'
  const isEvent = kind === 'event'
  const title = isTask ? 'Nova tarefa' : isEvent ? 'Novo evento' : 'Nova matéria'

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const data = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: String(data.get('name')),
        date: String(data.get('date') || ''),
        subject: String(data.get('subject') || ''),
        priority: String(data.get('priority') || 'Normal'),
        color: String(data.get('color') || 'blue'),
      })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form className="modal-card" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <div className="eyebrow">ORGANIZE SEU PRÓXIMO PASSO</div>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <label>
          Nome
          <input
            name="name"
            autoFocus
            placeholder={
              isTask
                ? 'Ex.: Revisar capítulo 3'
                : isEvent
                  ? 'Ex.: Prova de matemática'
                  : 'Ex.: Matemática'
            }
            required
            maxLength={90}
          />
        </label>

        {isTask && (
          <label>
            Matéria
            <select name="subject">
              <option value="">Sem matéria definida</option>
              {subjects.map(subject => (
                <option key={subject.id}>{subject.name}</option>
              ))}
            </select>
          </label>
        )}

        {(isTask || isEvent) && (
          <label>
            {isTask ? 'Prazo' : 'Data'}
            <input name="date" type="date" required={isEvent} />
          </label>
        )}

        {isTask && (
          <label>
            Prioridade
            <select name="priority">
              <option>Normal</option>
              <option>Alta</option>
              <option>Baixa</option>
            </select>
          </label>
        )}

        {error && <div className="error-note" role="alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? <span className="spinner" /> : <Plus size={16} />} {saving ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      </form>
    </div>
  )
}
