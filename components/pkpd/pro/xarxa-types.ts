export type Vista = 'casos' | 'nuevo' | 'bandeja' | 'sesiones' | 'reporting' | 'profesionales' | 'agentes' | 'admin' | 'config'

export type Gap = {
  label: string
  severity: 'Crítico' | 'Importante' | 'Informativo' | string
  status: string
}

export type Task = {
  taskId: string
  title: string
  ownerRole: string
  ownerId?: string
  priority: string
  status: string
  dueDate?: string
  createdBy?: string
  caseId?: string
}

export type TimelineEvent = {
  date: string
  lane: string
  type: string
  label: string
  actorName?: string
  actorRole?: string
  actorCenter?: string
  actorType?: string
}

export type LabDeterminant = {
  label: string
  value: string | number
  unit: string | null
  status: string
  source: string
  relationToDose?: string
  interpretation?: string
}

export type PatientProfile = {
  age?: number | null
  sex?: string | null
  weightKg?: number | null
  heightCm?: number | null
  specialPopulation?: string[]
}

export type FieldReviewMeta = {
  origin: 'llm' | 'manual'
  state: 'pending' | 'confirmed' | 'edited'
  sourceLabel?: string
}

export type AutomationSummary = {
  headline: string
  stepsCompleted: number
  tasksCreated: number
  pendingTasks: number
  draftsReady: number
  highlights: string[]
  agentsInvolved: string[]
  lastRunAt?: string | null
  hasRecommendationDraft?: boolean
  hasNoteDraft?: boolean
}

export type CaseOutcome = {
  recommendationAccepted?: string
  clinicalResponse?: string
  treatmentDecision?: string
  adverseEvents?: string
  networkLearning?: string
  summary?: string
}

export type FollowUpPlan = {
  label: string
  status: string
  dueDate?: string
  controlType?: string
  rationale?: string
  intervalDays?: number
}

export type CasoResumen = {
  _id?: string
  caseId: string
  demoSeedTag?: string
  demoLocked?: boolean
  deletable?: boolean
  title: string
  patientCode: string
  programId: string
  specialty: string
  centerId: string
  centerName: string
  requesterId: string
  requesterName: string
  assignedTo: string
  assignedName: string
  caseType: string
  entrySource: string
  priority: string
  pipelineStage: string
  nextAction: string
  createdAt: string
  updatedAt: string
  gaps: Gap[]
  tasks: Task[]
  automationSummary?: AutomationSummary
}

export type CasoCompleto = CasoResumen & {
  clinicalSummary: string
  emailOriginal?: string
  fieldReview?: Record<string, FieldReviewMeta>
  patientProfile?: PatientProfile
  diseaseContext: Record<string, string>
  therapyContext: Record<string, string | null>
  labDeterminants: LabDeterminant[]
  timeline: TimelineEvent[]
  pkpdInterpretation: { pattern: string; confidence: string; summary: string }
  simulation?: { currentScenario: string; preferredScenario: string; scenarios: string[] }
  recommendation: { status: string; text: string }
  clinicalNote: { status: string; text: string }
  caseOutcome?: CaseOutcome
  followUps: FollowUpPlan[]
  agentRuns?: Array<{ agent: string; status: string; message: string; timestamp: string }>
  automationSummary?: AutomationSummary
}

export type PatientHistoryItem = {
  caseId: string
  title: string
  caseType: string
  pipelineStage: string
  updatedAt: string
  centerName: string
  priority: string
}

export type PatientHistoryPayload = {
  patientCode: string
  items: PatientHistoryItem[]
  latestCase?: Pick<
    CasoCompleto,
    'caseId' | 'title' | 'patientProfile' | 'diseaseContext' | 'therapyContext' | 'clinicalSummary'
  > | null
}

export type KpiCard = { label: string; value: number }

export type ChartSeries = { label: string; value: number }

export type ReportingData = {
  kpis: KpiCard[]
  charts: Array<{ label: string; data: ChartSeries[] }>
}

export type Professional = {
  _id: string
  name: string
  roleId?: string
  roleLabel: string
  centerId: string
  centerName?: string
  specialties: string[]
  programs: string[]
  status: string
  activeCases?: number
  validatedCases?: number
  responseTimeLabel?: string
  availability?: string
  requestReason?: string
  requestedDate?: string
  expertise?: string[]
  avatarUrl?: string
}

export type Center = {
  _id: string
  name: string
  type: string
  territory: string
  city: string
  status: string
  programs: string[]
  demoNote?: string
}

export type Agent = {
  _id: string
  label: string
  status: string
  programId: string
  function: string
  requiresHumanValidation: boolean
  limits: string[]
  metrics?: {
    totalRuns: number
    casesTouched: number
    lastRunAt?: string | null
    draftsPrepared: number
  }
  recentRuns?: Array<{ agent: string; status: string; message: string; timestamp: string; caseId?: string }>
}

export type InboxStepStatus = 'done' | 'running' | 'pending'

export type InboxItem = {
  _id: string
  from: string
  subject: string
  receivedAt: string
  body: string
  agentStatus: 'pending' | 'processing' | 'ready' | 'error' | 'created'
  agentSteps: Array<{ label: string; status: InboxStepStatus }>
  programSuggestion?: string
  caseTypeSuggestion?: string
  confidence?: number
  centerId?: string
  centerName?: string
  requesterId?: string
  requesterName?: string
  createdCaseId?: string | null
  extraction?: {
    patientCode: string
    drug: string
    indication: string
    weight: string
    recentDose: string
    levelResult: string
    requestType: string
    currentDose?: string
    interval?: string
    route?: string
    crp?: string
    calprotectin?: string
    antibodies?: string
    phenotype?: string
    activity?: string
    sex?: string
    age?: number
  }
}

export type Program = {
  _id: string
  label: string
  specialty: string
  status: string
  version: string
  conditions?: string[]
  drugs?: string[]
  determinants?: string[]
  caseTypes?: string[]
  workflowStages?: string[]
  sharingPolicy?: string
  protocol?: {
    title?: string
    summary?: string
    alignment?: string
    lastReview?: string
    semantics?: string[]
    references?: Array<{
      label: string
      url: string
      source?: string
    }>
  }
}

export type ClinicalForm = {
  _id: string
  label: string
  programId: string
  sections: Array<{
    label: string
    fields: string[]
  }>
}

export type Role = {
  _id: string
  label: string
  scope: string
  permissions: string[]
}

export type ProfessionalApproval = {
  _id: string
  name: string
  requestedRoleId: string
  requestedRoleLabel: string
  requestedCenterId: string
  requestedCenterName: string
  specialties: string[]
  programs: string[]
  status: string
  requestedDate: string
  requestReason: string
}

export const PIPELINE_STAGES = [
  'Solicitud recibida',
  'Caso creado por IA',
  'Datos incompletos',
  'Pendiente de determinantes',
  'Determinantes recibidos',
  'Análisis PK/PD generado',
  'Revisión farmacéutica',
  'Revisión médica',
  'Discusión en red',
  'Informe generado',
  'Informe validado',
  'Registrado en HCE',
  'Seguimiento 4 semanas',
  'Seguimiento 8 semanas',
  'Cerrado con resultado',
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const PRIORITY_STYLE: Record<string, string> = {
  Alta:    'bg-rose-600 text-white font-semibold',
  Media:   'bg-amber-500 text-white font-semibold',
  Baja:    'bg-emerald-600 text-white font-semibold',
  Urgente: 'bg-red-700 text-white font-bold',
}

export const STAGE_STYLE: Record<string, string> = {
  'Solicitud recibida':          'bg-slate-500 text-white',
  'Caso creado por IA':          'bg-violet-600 text-white',
  'Datos incompletos':           'bg-amber-500 text-white',
  'Pendiente de determinantes':  'bg-orange-600 text-white',
  'Determinantes recibidos':     'bg-yellow-500 text-slate-900',
  'Análisis PK/PD generado':     'bg-blue-600 text-white',
  'Revisión farmacéutica':       'bg-purple-700 text-white',
  'Revisión médica':             'bg-fuchsia-600 text-white',
  'Discusión en red':            'bg-indigo-600 text-white',
  'Informe generado':            'bg-teal-600 text-white',
  'Informe validado':            'bg-emerald-600 text-white',
  'Registrado en HCE':           'bg-green-700 text-white',
  'Seguimiento 4 semanas':       'bg-cyan-600 text-white',
  'Seguimiento 8 semanas':       'bg-sky-600 text-white',
  'Cerrado con resultado':       'bg-slate-600 text-white',
}

export const STAGE_LABEL: Record<string, string> = {
  'Solicitud recibida':          'Recibida',
  'Caso creado por IA':          'Creado IA',
  'Datos incompletos':           'Incompleto',
  'Pendiente de determinantes':  'P. determin.',
  'Determinantes recibidos':     'Det. recibidos',
  'Análisis PK/PD generado':     'Análisis PK/PD',
  'Revisión farmacéutica':       'Rev. farmacia',
  'Revisión médica':             'Rev. médica',
  'Discusión en red':            'Disc. en red',
  'Informe generado':            'Inf. generado',
  'Informe validado':            'Inf. validado',
  'Registrado en HCE':           'En HCE',
  'Seguimiento 4 semanas':       'Seguim. 4s',
  'Seguimiento 8 semanas':       'Seguim. 8s',
  'Cerrado con resultado':       'Cerrado',
}

export const SEVERITY_STYLE: Record<string, string> = {
  Crítico:    'bg-rose-600 text-white font-semibold',
  Importante: 'bg-amber-500 text-white font-semibold',
  Informativo:'bg-blue-500 text-white',
}
