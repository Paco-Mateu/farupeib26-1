import type { CasoCompleto, Program } from '@/components/pkpd/pro/xarxa-types'

export type ProtocolSemanticFrame = {
  label: string
  rationale: string
  caution?: string
}

export function getProgramProtocol(program?: Program | null) {
  if (program?.protocol) return program.protocol

  if (program?.label?.toLowerCase().includes('crohn')) {
    return {
      title: 'Crohn PK/PD',
      summary:
        'Circuito de optimización terapéutica reactiva en EII con lectura integrada de exposición, inmunogenicidad, biomarcadores e historia terapéutica.',
      alignment:
        'Alineado con protocolo local y fuentes de referencia para TDM reactivo en EII, con validación farmacéutica y médica obligatoria.',
      lastReview: '2026-05-18',
      semantics: [
        'Datos insuficientes o muestra no interpretable',
        'Baja exposición sin inmunogenicidad dominante',
        'Baja exposición con inmunogenicidad probable',
        'Exposición adecuada con inflamación persistente',
        'Exposición alta con respuesta controlada',
        'Ratificación de pauta actual',
      ],
      references: [
        {
          label: 'AGA · TDM en EII',
          url: 'https://gastro.org/clinical-guidance/therapeutic-drug-monitoring-in-inflammatory-bowel-disease-ibd/',
          source: 'AGA',
        },
        {
          label: 'MIPD al lado de la cama en EII',
          url: 'https://academic.oup.com/ibdjournal/article/29/8/1342/6839996',
          source: 'Inflammatory Bowel Diseases',
        },
        {
          label: 'Dashboard de dosificación biológica',
          url: 'https://academic.oup.com/ibdjournal/article/28/Supplement_1/S98/6514104',
          source: 'Inflammatory Bowel Diseases',
        },
      ],
    }
  }

  return null
}

export function deriveProtocolSemanticFrame(caso: CasoCompleto): ProtocolSemanticFrame {
  const text = [
    caso.title,
    caso.caseType,
    caso.clinicalSummary,
    caso.pkpdInterpretation?.pattern,
    caso.pkpdInterpretation?.summary,
  ]
    .join(' ')
    .toLowerCase()
  const determinants = caso.labDeterminants ?? []
  const trough = determinants.find(
    (item) =>
      String(item.relationToDose ?? '').toLowerCase().includes('valle') ||
      /concentraci[oó]n|trough|nivel/i.test(item.label),
  )
  const antibodies = determinants.find((item) => /anticuerpo|anti-f[aá]rmaco|anti-drug/i.test(item.label))
  const antibodyPositive =
    !!antibodies && (
      Number(antibodies.value) > 0 ||
      String(antibodies.interpretation ?? '').toLowerCase().includes('positivo') ||
      String(antibodies.interpretation ?? '').toLowerCase().includes('detect')
    )
  const hasInflammationSignal =
    /inflam|actividad|persist|parcial|brote|calprotectina|pcr|crp/.test(text) ||
    determinants.some((item) => /pcr|crp|calprotectina/i.test(item.label))
  const sampleConfirmed = String(trough?.relationToDose ?? '').toLowerCase().includes('confirm')
  const hasExposureLow = /baja expos|subter|infrados|p[eé]rdida de respuesta/.test(text)
  const hasExposureHigh = /alta expos|sobreexpos|suprater|toxicidad|remisi[oó]n con exposici[oó]n alta/.test(text)
  const hasExposureAdequate = /adecuad|en rango|exposici[oó]n adecuada/.test(text)

  if (!sampleConfirmed || determinants.filter((item) => item.status === 'Confirmado').length === 0) {
    return {
      label: 'Datos insuficientes o muestra no interpretable',
      rationale:
        'Antes de decidir la pauta conviene confirmar temporalidad de la muestra, determinantes clave y consistencia analítica.',
      caution: 'No convertir este bloque en recomendación firme hasta validar la interpretabilidad.',
    }
  }

  if (hasExposureLow && antibodyPositive) {
    return {
      label: 'Baja exposición con inmunogenicidad probable',
      rationale:
        'La lectura combina exposición insuficiente con señal de anticuerpos, lo que orienta la discusión hacia inmunogenicidad y posible cambio terapéutico.',
      caution: 'Revisar técnica analítica, título de anticuerpos e historial de biológicos antes de cerrar la decisión.',
    }
  }

  if (hasExposureLow) {
    return {
      label: 'Baja exposición sin inmunogenicidad dominante',
      rationale:
        'La señal principal es exposición insuficiente y favorece revisar intensificación, adherencia, intervalo y cronología de administración.',
      caution: 'Mantener la validación farmacéutica antes de proponer optimización definitiva.',
    }
  }

  if ((hasExposureAdequate || text.includes('adecuada')) && hasInflammationSignal) {
    return {
      label: 'Exposición adecuada con inflamación persistente',
      rationale:
        'La exposición parece compatible con objetivo, pero la actividad inflamatoria persiste y la discusión debe centrarse en fallo farmacodinámico o cambio de mecanismo.',
      caution: 'Evitar intensificar solo por inercia si la exposición ya es adecuada.',
    }
  }

  if (hasExposureHigh) {
    return {
      label: 'Exposición alta con respuesta controlada',
      rationale:
        'La lectura favorece ratificación prudente o desintensificación controlada, siempre condicionada a estabilidad clínica y plan de seguimiento.',
      caution: 'La desintensificación requiere plan de control y reevaluación explícitos.',
    }
  }

  return {
    label: 'Ratificación de pauta actual',
    rationale:
      'Con los datos actuales, la pauta vigente funciona como comparador base y puede mantenerse mientras se completa la validación clínica.',
    caution: 'Revisar si hay biomarcadores o eventos clínicos recientes que justifiquen cambiar de estrategia.',
  }
}

export function formatProtocolReviewDate(value?: string | null) {
  if (!value) return 'Sin fecha de revisión'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}
