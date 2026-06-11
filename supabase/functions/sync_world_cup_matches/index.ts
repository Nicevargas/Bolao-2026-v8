import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_16: 'Oitavas de Final',
  QUARTER_FINALS: 'Quartas de Final',
  SEMI_FINALS: 'Semifinal',
  THIRD_PLACE: 'Disputa de Terceiro Lugar',
  FINAL: 'Final',
}

function mapStage(stage: string): string {
  return STAGE_MAP[stage] || stage
}

function mapGroup(group: string | null): string | null {
  if (!group) return null
  const match = group.match(/^GROUP_([A-Z])$/)
  if (match) return `Grupo ${match[1]}`
  return group
}

function getRoundNumber(stage: string, matchday: number): string {
  if (stage === 'GROUP_STAGE') {
    return `Fase de Grupos - Rodada ${matchday}`
  }
  return mapStage(stage)
}

function mapStatus(status: string): {
  status: 'aguardando' | 'ao_vivo' | 'encerrado'
  locked: boolean
} {
  switch (status) {
    case 'FINISHED':
      return { status: 'encerrado', locked: true }
    case 'IN_PLAY':
    case 'PAUSED':
      return { status: 'ao_vivo', locked: true }
    default:
      return { status: 'aguardando', locked: false }
  }
}

function getTeamFlagEmoji(teamName: string): string {
  if (!teamName) return '\u{1F3F3}\u{FE0F}'
  const clean = teamName
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const flagMap: Record<string, string> = {
    brasil: '\u{1F1E7}\u{1F1F7}',
    argentina: '\u{1F1E6}\u{1F1F7}',
    'estados unidos': '\u{1F1FA}\u{1F1F8}',
    eua: '\u{1F1FA}\u{1F1F8}',
    usa: '\u{1F1FA}\u{1F1F8}',
    mexico: '\u{1F1F2}\u{1F1FD}',
    franca: '\u{1F1EB}\u{1F1F7}',
    alemanha: '\u{1F1E9}\u{1F1EA}',
    espanha: '\u{1F1EA}\u{1F1F8}',
    portugal: '\u{1F1F5}\u{1F1F9}',
    japao: '\u{1F1EF}\u{1F1F5}',
    italia: '\u{1F1EE}\u{1F1F9}',
    inglaterra: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    england: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    uruguai: '\u{1F1FA}\u{1F1FE}',
    uruguay: '\u{1F1FA}\u{1F1FE}',
    holanda: '\u{1F1F3}\u{1F1F1}',
    netherlands: '\u{1F1F3}\u{1F1F1}',
    belgica: '\u{1F1E7}\u{1F1EA}',
    belgium: '\u{1F1E7}\u{1F1EA}',
    marrocos: '\u{1F1F2}\u{1F1E6}',
    morocco: '\u{1F1F2}\u{1F1E6}',
    croacia: '\u{1F1ED}\u{1F1F7}',
    croatia: '\u{1F1ED}\u{1F1F7}',
    canada: '\u{1F1E8}\u{1F1E6}',
    senegal: '\u{1F1F8}\u{1F1F3}',
    equador: '\u{1F1EA}\u{1F1E8}',
    qatar: '\u{1F1F6}\u{1F1E6}',
    gales: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}',
    ira: '\u{1F1EE}\u{1F1F7}',
    polonia: '\u{1F1F5}\u{1F1F1}',
    'arabia saudita': '\u{1F1F8}\u{1F1E6}',
    tunisia: '\u{1F1F9}\u{1F1F3}',
    dinamarca: '\u{1F1E9}\u{1F1F0}',
    australia: '\u{1F1E6}\u{1F1FA}',
    'costa rica': '\u{1F1E8}\u{1F1F7}',
    suica: '\u{1F1E8}\u{1F1ED}',
    camaroes: '\u{1F1E8}\u{1F1F2}',
    servia: '\u{1F1F7}\u{1F1F8}',
    gana: '\u{1F1EC}\u{1F1ED}',
    cameroon: '\u{1F1E8}\u{1F1F2}',
    'coreia do norte': '\u{1F1F0}\u{1F1F5}',
    hungria: '\u{1F1ED}\u{1F1FA}',
    hungary: '\u{1F1ED}\u{1F1FA}',
    irlanda: '\u{1F1EE}\u{1F1EA}',
    escocia: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
    scotland: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
    noruega: '\u{1F1F3}\u{1F1F4}',
    norway: '\u{1F1F3}\u{1F1F4}',
    suecia: '\u{1F1F8}\u{1F1EA}',
    sweden: '\u{1F1F8}\u{1F1EA}',
    austria: '\u{1F1E6}\u{1F1F9}',
    egito: '\u{1F1EA}\u{1F1EC}',
    egypt: '\u{1F1EA}\u{1F1EC}',
    'costa do marfim': '\u{1F1E8}\u{1F1EE}',
    nigeria: '\u{1F1F3}\u{1F1EC}',
    mali: '\u{1F1F2}\u{1F1F9}',
    ucraina: '\u{1F1FA}\u{1F1E6}',
    ukraine: '\u{1F1FA}\u{1F1E6}',
    colombia: '\u{1F1E8}\u{1F1F4}',
    chile: '\u{1F1E8}\u{1F1F1}',
    peru: '\u{1F1F5}\u{1F1EA}',
    venezuela: '\u{1F1FB}\u{1F1EA}',
    paraguai: '\u{1F1F5}\u{1F1FE}',
    paraguay: '\u{1F1F5}\u{1F1FE}',
    'africa do sul': '\u{1F1FF}\u{1F1E6}',
    irlanda do norte: '\u{1F3F4}\u{E0067}\u{E0062}\u{E006E}\u{E0069}\u{E007F}',
    wales: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}',
    republica tcheca: '\u{1F1E8}\u{1F1FF}',
    turquia: '\u{1F1F9}\u{1F1F7}',
    turkey: '\u{1F1F9}\u{1F1F7}',
    russia: '\u{1F1F7}\u{1F1FA}',
    grecia: '\u{1F1EC}\u{1F1F7}',
    greece: '\u{1F1EC}\u{1F1F7}',
    romenia: '\u{1F1F7}\u{1F1F4}',
    romania: '\u{1F1F7}\u{1F1F4}',
    china: '\u{1F1E8}\u{1F1F3}',
    india: '\u{1F1EE}\u{1F1F3}',
    jamaica: '\u{1F1EF}\u{1F1F2}',
    trinidad: '\u{1F1F9}\u{1F1F9}',
    honduras: '\u{1F1ED}\u{1F1F3}',
    panama: '\u{1F1F5}\u{1F1E6}',
    cuba: '\u{1F1E8}\u{1F1FA}',
    'republica dominicana': '\u{1F1E9}\u{1F1F4}',
    haiti: '\u{1F1ED}\u{1F1F9}',
    bolivia: '\u{1F1E7}\u{1F1F4}',
    guiana: '\u{1F1EC}\u{1F1FE}',
    suriname: '\u{1F1F8}\u{1F1F7}',
    'guiana francesa': '\u{1F1EC}\u{1F1EB}',
    'nva caledonia': '\u{1F1F3}\u{1F1E8}',
    taiti: '\u{1F1F5}\u{1F1F4}',
    fiji: '\u{1F1EB}\u{1F1F0}',
    'ilhas salomao': '\u{1F1F8}\u{1F1E7}',
    vanuatu: '\u{1F1FB}\u{1F1FA}',
    samoa: '\u{1F1FC}\u{1F1F8}',
    tonga: '\u{1F1F9}\u{1F1F4}',
    'ilhas cook': '\u{1F1E8}\u{1F1F0}',
    'papua nova guine': '\u{1F1F5}\u{1F1EC}',
    'timor leste': '\u{1F1F9}\u{1F1F1}',
    indonesia: '\u{1F1EE}\u{1F1E9}',
    malasia: '\u{1F1F2}\u{1F1FE}',
    singapura: '\u{1F1F8}\u{1F1EC}',
    filipinas: '\u{1F1F5}\u{1F1ED}',
    vietna: '\u{1F1FB}\u{1F1F3}',
    myanmar: '\u{1F1F2}\u{1F1F2}',
    camboja: '\u{1F1F0}\u{1F1ED}',
    laos: '\u{1F1F1}\u{1F1E6}',
    tailandia: '\u{1F1F9}\u{1F1ED}',
    brunei: '\u{1F1E7}\u{1F1F3}',
    mongolia: '\u{1F1F2}\u{1F1F3}',
    butao: '\u{1F1E7}\u{1F1F9}',
    nepal: '\u{1F1F3}\u{1F1F5}',
    bangladesh: '\u{1F1E7}\u{1F1E9}',
    'sri lanka': '\u{1F1F1}\u{1F1F0}',
    maldivas: '\u{1F1F2}\u{1F1FB}',
    cazaquistao: '\u{1F1F0}\u{1F1FF}',
    quirguistao: '\u{1F1F0}\u{1F1EC}',
    tadjiquistao: '\u{1F1F9}\u{1F1EF}',
    turcomenistao: '\u{1F1F9}\u{1F1F2}',
    uzbequistao: '\u{1F1FA}\u{1F1FF}',
    afeganistao: '\u{1F1E6}\u{1F1EB}',
    paquistao: '\u{1F1F5}\u{1F1F0}',
  }

  for (const key of Object.keys(flagMap)) {
    if (clean.includes(key) || key.includes(clean)) {
      return flagMap[key]
    }
  }
  return '\u{1F3F3}\u{FE0F}'
}

function calculatePoints(
  realA: number,
  realB: number,
  predA: number,
  predB: number,
) {
  let points_result = 0
  let points_goals_a = 0
  let points_goals_b = 0
  let points_bonus = 0

  const realResult = realA > realB ? 'A' : realA < realB ? 'B' : 'Empate'
  const predResult = predA > predB ? 'A' : predA < predB ? 'B' : 'Empate'

  if (realResult === predResult) {
    points_result = 2
  }

  if (realA === predA) {
    points_goals_a = 1
  }

  if (realB === predB) {
    points_goals_b = 1
  }

  if (realA === predA && realB === predB) {
    points_bonus = 1
  }

  return {
    points_result,
    points_goals_a,
    points_goals_b,
    points_bonus,
    points_total: points_result + points_goals_a + points_goals_b + points_bonus,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('M\u00e9todo n\u00e3o permitido. Use POST.', {
      status: 405,
      headers: corsHeaders,
    })
  }

  const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'FOOTBALL_DATA_API_KEY n\u00e3o configurada.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY n\u00e3o configurados.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const summary = {
    success: false,
    inserted: 0,
    updated: 0,
    finished: 0,
    errors: [] as string[],
  }

  try {
    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      { headers: { 'X-Auth-Token': apiKey } },
    )

    if (!response.ok) {
      const errorText = `API Football-Data retornou status ${response.status}: ${response.statusText}`

      await supabase.from('audit_logs').insert({
        user_id: null,
        event_type: 'system',
        description: `Erro na sincroniza\u00e7\u00e3o: ${errorText}`,
      })

      return new Response(
        JSON.stringify({ success: false, error: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const data = await response.json()

    if (!data.matches || !Array.isArray(data.matches)) {
      const errorText = 'Resposta da API n\u00e3o cont\u00e9m lista de partidas.'

      await supabase.from('audit_logs').insert({
        user_id: null,
        event_type: 'system',
        description: `Erro na sincroniza\u00e7\u00e3o: ${errorText}`,
      })

      return new Response(
        JSON.stringify({ success: false, error: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    for (const match of data.matches) {
      try {
        const { status: mappedStatus, locked } = mapStatus(match.status || 'SCHEDULED')

        let stadium = ''
        let city = ''
        if (match.venue) {
          const parts = match.venue.split(',').map((s: string) => s.trim())
          stadium = parts[0] || ''
          city = parts[1] || ''
        }

        const matchPayload = {
          id: String(match.id),
          phase: mapStage(match.stage || ''),
          group_name: mapGroup(match.group || null),
          round_number: getRoundNumber(match.stage || '', match.matchday || 0),
          team_a: match.homeTeam?.name || '',
          team_b: match.awayTeam?.name || '',
          flag_a: getTeamFlagEmoji(match.homeTeam?.name || ''),
          flag_b: getTeamFlagEmoji(match.awayTeam?.name || ''),
          match_date: match.utcDate,
          stadium,
          city,
          goals_a: match.score?.fullTime?.home ?? null,
          goals_b: match.score?.fullTime?.away ?? null,
          status: mappedStatus,
          locked,
        }

        const { data: existing } = await supabase
          .from('matches')
          .select('id, status, goals_a, goals_b, locked')
          .eq('id', String(match.id))
          .maybeSingle()

        if (existing) {
          const wasFinished = existing.status === 'encerrado'
          const isNowFinished = mappedStatus === 'encerrado'

          await supabase
            .from('matches')
            .update(matchPayload)
            .eq('id', String(match.id))

          summary.updated++

          if (isNowFinished && !wasFinished) {
            summary.finished++

            const goalsA = match.score?.fullTime?.home
            const goalsB = match.score?.fullTime?.away

            if (goalsA !== null && goalsB !== null) {
              const { data: bets } = await supabase
                .from('bets')
                .select('id, bet_goals_a, bet_goals_b')
                .eq('match_id', String(match.id))

              if (bets) {
                for (const bet of bets) {
                  const calc = calculatePoints(
                    goalsA,
                    goalsB,
                    bet.bet_goals_a,
                    bet.bet_goals_b,
                  )

                  await supabase
                    .from('bets')
                    .update({
                      points_result: calc.points_result,
                      points_goals_a: calc.points_goals_a,
                      points_goals_b: calc.points_goals_b,
                      points_bonus: calc.points_bonus,
                      points_total: calc.points_total,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', bet.id)
                }
              }

              const { data: profiles } = await supabase
                .from('profiles')
                .select('id')

              if (profiles) {
                for (const profile of profiles) {
                  const { data: userBets } = await supabase
                    .from('bets')
                    .select('points_total, points_bonus, points_result')
                    .eq('user_id', profile.id)

                  let totalPoints = 0
                  let exactScores = 0
                  let correctResults = 0

                  for (const b of userBets || []) {
                    totalPoints += b.points_total || 0
                    if (b.points_bonus > 0) exactScores++
                    if (b.points_result > 0) correctResults++
                  }

                  await supabase
                    .from('rankings')
                    .upsert({
                      user_id: profile.id,
                      total_points: totalPoints,
                      exact_scores: exactScores,
                      correct_results: correctResults,
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' })
                }
              }

              await supabase.from('audit_logs').insert({
                user_id: null,
                event_type: 'match',
                description: `Partida ${match.homeTeam?.name} x ${match.awayTeam?.name} encerrada: ${goalsA} x ${goalsB}. Placar oficial atualizado, palpites recalculados e rankings atualizados.`,
                new_data: matchPayload,
              })
            }
          }
        } else {
          await supabase
            .from('matches')
            .insert(matchPayload)

          summary.inserted++
        }
      } catch (matchError: unknown) {
        const msg = matchError instanceof Error ? matchError.message : String(matchError)
        summary.errors.push(`Erro ao processar partida ${match.id}: ${msg}`)
      }
    }

    if (summary.errors.length === 0) {
      await supabase.from('audit_logs').insert({
        user_id: null,
        event_type: 'system',
        description: `Sincroniza\u00e7\u00e3o autom\u00e1tica conclu\u00edda: ${summary.inserted} inseridos, ${summary.updated} atualizados, ${summary.finished} encerrados.`,
      })
    }

    summary.success = true

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)

    try {
      await supabase.from('audit_logs').insert({
        user_id: null,
        event_type: 'system',
        description: `Erro cr\u00edtico na sincroniza\u00e7\u00e3o: ${msg}`,
      })
    } catch {
    }

    summary.errors.push(msg)

    return new Response(
      JSON.stringify(summary),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
