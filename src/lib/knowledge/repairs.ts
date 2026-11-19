import "server-only";

/**
 * Base de conhecimento local de apoio ao diagnóstico.
 * Conteúdo original e genérico — NÃO substitui o manual do fabricante.
 * Sempre confirmar especificações, pinagens e procedimentos no manual técnico da viatura.
 */

export type RepairArticle = {
  id: string;
  category: string;
  title: string;
  symptoms: string[];
  tags: string[];
  obdCodes?: string[];
  causes: string[];
  diagnostic: string[];
  fix: string[];
  safety: string;
};

export const REPAIR_ARTICLES: RepairArticle[] = [
  {
    id: "motor-nao-arranca",
    category: "Arranque e carga",
    title: "Motor não arranca ou arranca com dificuldade",
    symptoms: ["não arranca", "arranque lento", "motor não pega", "arranca e desliga"],
    tags: ["bateria", "arranque", "motor de arranque", "combustível", "ignição"],
    causes: ["Bateria fraca ou terminal oxidado", "Motor de arranque ou solenoide com falha", "Bomba de combustível sem pressão", "Velas/bobinas com falha", "Sensor de posição da cambota (CKP) em falha"],
    diagnostic: ["Medir tensão da bateria em repouso (≈12,6 V) e durante o arranque (não deve descer abaixo de ≈9,6 V)", "Verificar consumos de arranque e massas", "Confirmar pressão de combustível e funcionamento da bomba", "Ler códigos de avaria com scanner OBD-II", "Verificar faísca e injecção"],
    fix: ["Limpar e apertar terminais; carregar ou substituir bateria", "Substituir motor de arranque se não girar ou girar sem engrenar", "Substituir filtro/bomba de combustível conforme diagnóstico", "Substituir velas, bobinas ou sensor CKP"],
    safety: "Nunca ligar directamente o motor de arranque sem isolamento; evitar faíscas perto da bateria.",
  },
  {
    id: "ralenti-irregular",
    category: "Motor",
    title: "Ralenti irregular ou motor a falhar (misfire)",
    symptoms: ["ralenti irregular", "motor treme", "falhas de ignição", "perda de potência"],
    tags: ["velas", "bobinas", "injectores", "massa de ar", "admissão"],
    obdCodes: ["P0300", "P0301", "P0302", "P0303", "P0304"],
    causes: ["Velas ou bobinas desgastadas", "Injector obstruído", "Fuga de vácuo/admissão", "Sensor MAF sujo", "Compressão baixa num cilindro"],
    diagnostic: ["Ler códigos P030x para identificar o cilindro", "Trocar bobinas entre cilindros e ver se o erro acompanha", "Inspeccionar velas e cabos", "Verificar pressão de combustível e fuga de ar", "Teste de compressão se persistir"],
    fix: ["Substituir velas/bobinas conforme diagnóstico", "Limpar ou substituir injectores", "Corrigir mangueiras de admissão e limpar MAF", "Reparar falha mecânica interna se confirmada"],
    safety: "Misfire prolongado pode danificar o catalisador — evitar condução prolongada até correcção.",
  },
  {
    id: "travagem-ruido",
    category: "Travões",
    title: "Barulho ao travar ou travagem menos eficaz",
    symptoms: ["barulho ao travar", "apito ao travar", "travagem mole", "vibração ao travar"],
    tags: ["pastilhas", "discos", "travões", "ABS"],
    causes: ["Pastilhas gastas ou com vidragem", "Discos com deformação/ferrugem", "Pinça com guia gripada", "Líquido de travões antigo ou com ar"],
    diagnostic: ["Medir espessura de pastilhas e discos", "Verificar desgaste irregular e pinças", "Verificar nível e cor do líquido", "Testar curso do pedal e código ABS"],
    fix: ["Substituir pastilhas e/ou discos em eixo", "Limpar e lubrificar guias da pinça", "Sangrar o sistema e substituir líquido conforme intervalo"],
    safety: "Travões são segurança crítica: substituir sempre em pares no mesmo eixo e seguir o torque do fabricante.",
  },
  {
    id: "puxa-lado",
    category: "Direção e suspensão",
    title: "Viatura puxa para um lado ou desgasta pneus de forma irregular",
    symptoms: ["puxa para o lado", "volante desalinhado", "desgaste irregular dos pneus"],
    tags: ["alinhamento", "pneus", "suspensão", "rolamentos"],
    causes: ["Alinhamento (camber/caster/toe) fora de especificação", "Pressão dos pneus incorrecta", "Rolamento ou rótula com folga", "Amortecedor com falha"],
    diagnostic: ["Verificar pressão e desgaste dos pneus", "Inspeccionar folgas com a viatura levantada", "Medir geometria em máquina de alinhamento", "Verificar amortecedores"],
    fix: ["Corrigir alinhamento após substituir peças de suspensão", "Substituir rolamentos/rótulas/amortecedores", "Rodizar pneus e ajustar pressões"],
    safety: "Após qualquer intervenção na suspensão, é obrigatório verificar geometria.",
  },
  {
    id: "sobreaquecimento",
    category: "Arrefecimento",
    title: "Motor a sobreaquecer",
    symptoms: ["temperatura alta", "sobreaquecimento", "vapor no capô"],
    tags: ["radiador", "termostato", "bomba de água", "ventoinha", "líquido de arrefecimento"],
    obdCodes: ["P0128"],
    causes: ["Nível baixo de líquido ou fuga", "Termostato gripado", "Bomba de água ou ventoinha com falha", "Radiador obstruído ou tampa do depósito defeituosa"],
    diagnostic: ["Verificar nível e procurar fugas com o motor frio", "Observar abertura do termostato e funcionamento da ventoinha", "Testar tampa do depósito e circulação", "Teste de pressão do sistema"],
    fix: ["Reparar fugas e repor líquido com a especificação correcta", "Substituir termostato, bomba ou ventoinha", "Limpar/substituir radiador"],
    safety: "Nunca abrir o depósito com o motor quente — risco de queimaduras por líquido pressurizado.",
  },
  {
    id: "consumo-elevado",
    category: "Motor / Injecção",
    title: "Consumo de combustível acima do normal",
    symptoms: ["consumo elevado", "mais idas ao combustível"],
    tags: ["injectores", "sonda lambda", "pressão dos pneus", "filtro", "MAF"],
    obdCodes: ["P0171", "P0172", "P0420"],
    causes: ["Pressão dos pneus baixa", "Sonda lambda com falha", "Sensor MAF sujo", "Injectores com fugas", "Filtro de ar obstruído"],
    diagnostic: ["Verificar pressão dos pneus e peso transportado", "Ler trim fuel (STFT/LTFT) e códigos", "Inspeccionar filtro de ar e MAF", "Verificar fugas de combustível e injectores"],
    fix: ["Corrigir pressões e substituir filtros", "Limpar MAF e substituir sonda lambda", "Reparar injectores/fugas"],
    safety: "Trabalhar com combustível exige ventilação e ausência de chamas ou faíscas.",
  },
  {
    id: "luz-avaria-motor",
    category: "Electrónica / OBD",
    title: "Luz de avaria do motor acesa (códigos OBD-II)",
    symptoms: ["luz de avaria", "check engine", "código P"],
    tags: ["obd", "scanner", "sensores", "catalisador"],
    obdCodes: ["P0420", "P0442", "P0128", "P0562", "P0300"],
    causes: ["Falha de sensores", "Fuga no sistema de evaporação (EVAP)", "Catalisador com eficiência baixa", "Tensão de carga baixa"],
    diagnostic: ["Ler e guardar todos os códigos e dados de congelamento (freeze frame)", "Verificar estado de prontidão (readiness monitors)", "Analisar dados em tempo real antes de substituir peças", "Confirmar falha com testes dirigidos"],
    fix: ["Corrigir a causa raiz e apagar códigos apenas após reparação", "Rever tabs de inspecção/combustível se aplicável", "Repetir ciclo de condução para validar readiness"],
    safety: "Não apagar códigos sem diagnóstico — perde-se informação útil e pode chumbar na inspecção.",
  },
  {
    id: "ac-NAO-arrefece",
    category: "Climatização",
    title: "Ar condicionado não arrefece",
    symptoms: ["ar condicionado não arrefece", "ar quente", "humidade", "cheiro a mofo"],
    tags: ["gás", "compressor", "filtro habitáculo", "evaporador"],
    causes: ["Carga de refrigerante baixa (fuga)", "Compressor ou embraiagem com falha", "Filtro de habitáculo obstruído", "Evaporador com bactérias"],
    diagnostic: ["Verificar nível/carga de refrigerante com manómetros", "Procurar fugas com detector ou UV", "Verificar funcionamento do compressor e ventoinha", "Inspeccionar filtro de habitáculo"],
    fix: ["Reparar fuga e recarregar com o refrigerante e óleo correctos", "Substituir filtro e limpar evaporador", "Substituir compressor se confirmado"],
    safety: "Refrigerante sob pressão: usar equipamento adequado e recuperar o gás — nunca libertar para a atmosfera.",
  },
  {
    id: "bateria-descarrega",
    category: "Eléctrico",
    title: "Bateria descarrega com a viatura parada",
    symptoms: ["bateria descarrega", "não arranca de manhã", "consumo em repouso"],
    tags: ["bateria", "alternador", "consumo parasita", "porta", "relé"],
    causes: ["Consumo parasita (relé, luz, módulo que não adormece)", "Alternador com carga insuficiente", "Bateria no fim de vida", "Cabo de massa com oxidação"],
    diagnostic: ["Medir tensão de carga com motor a rolar (≈13,8–14,4 V)", "Medir consumo em repouso com multímetro em série (típico <50 mA)", "Remover fusíveis um a um para isolar o circuito", "Testar bateria em carga"],
    fix: ["Corrigir módulo/circuito com consumo parasita", "Substituir alternador ou regulador", "Limpar massas e substituir bateria se necessário"],
    safety: "Ao medir correntes, usar fusível de protecção no multímetro e não ligar cabos directamente à bateria.",
  },
  {
    id: "embreagem-patina",
    category: "Transmissão",
    title: "Embraiagem patina ou dificuldade em mudar de velocidade",
    symptoms: ["embreagem patina", "mudanças difíceis", "cheiro a queimado", "rotações sobem sem acelerar"],
    tags: ["embreagem", "caixa", "dispão", "óleo da caixa"],
    causes: ["Disco de embraiagem gasto ou contaminado com óleo", "Sistema hidráulico com ar ou fuga", "Dispão com falha", "Nível/qualidade do óleo da caixa incorrecto"],
    diagnostic: ["Teste de patinação: acelerar em 3.ª/4.ª e observar rotações", "Verificar nível e fugas do líquido da embraiagem", "Sangrar sistema hidráulico", "Verificar folga do pedal/cabo"],
    fix: ["Substituir kit de embraiagem", "Reparar fugas e sangrar o circuito", "Substituir dispão e corrigir nível da caixa"],
    safety: "Substituir a embraiagem implica separar caixa/motor — usar suporte e seguir torque do fabricante.",
  },
  {
    id: "direcao-barulho",
    category: "Direção e suspensão",
    title: "Barulho ou folga na direção",
    symptoms: ["barulho ao esterçar", "folga no volante", "estalo na suspensão"],
    tags: ["rótulas", "braços", "amortecedores", "direção"],
    causes: ["Rótulas ou buchas desgastadas", "Amortecedores com falha", "Barra de direção com folga", "Pneus com desgaste irregular"],
    diagnostic: ["Movimentar a roda com a viatura levantada e procurar folga", "Inspeccionar buchas, rótulas e amortecedores", "Verificar nível de óleo da direção (se hidráulica)"],
    fix: ["Substituir peças com folga em pares quando aplicável", "Verificar alinhamento após reparação", "Corrigir nível e fugas da direção"],
    safety: "Folga na direção compromete o controlo — reparar antes de conduzir normalmente.",
  },
  {
    id: "abs-esc-acesso",
    category: "Travões / Electrónica",
    title: "Luz ABS ou ESC/ESP acesa",
    symptoms: ["luz ABS", "luz ESC", "controlo de estabilidade", "travagem ABS inactiva"],
    tags: ["abs", "sensores de roda", "esc", "anilha magnética"],
    causes: ["Sensor de velocidade de roda com falha ou sujidade", "Anilha magnética/codificador danificado", "Fuga no circuito hidráulico ABS", "Módulo ABS com falha"],
    diagnostic: ["Ler códigos com scanner capaz de aceder ao módulo ABS", "Comparar velocidades das quatro rodas em dados reais", "Inspeccionar sensores, cablagem e anilhas", "Verificar nível de líquido"],
    fix: ["Limpar/substituir sensor e reparar cablagem", "Substituir anilha/rolamento consoante o caso", "Sangrar circuito ABS com equipamento adequado"],
    safety: "Com ABS/ESC inactivo a travagem de emergência é heterogénea — recomendar reparação urgente.",
  },
];

export type ObdCodeInfo = {
  code: string;
  title: string;
  causes: string[];
  firstChecks: string[];
};

export const OBD_CODES: ObdCodeInfo[] = [
  { code: "P0300", title: "Falhas de ignição aleatórias/múltiplas", causes: ["Velas/bobinas", "Injectores", "Fuga de vácuo", "Baixa compressão"], firstChecks: ["Ler freeze frame", "Comparar misfire counters por cilindro", "Verificar velas e bobinas"] },
  { code: "P0420", title: "Eficiência do catalisador abaixo do limite", causes: ["Catalisador envelhecido", "Sonda lambda com falha", "Fuga no escape", "Misfire prévio"], firstChecks: ["Verificar códigos de misfire", "Comparar sinais das sondas lambda", "Teste de fugas no escape"] },
  { code: "P0171", title: "Mistura pobre (banco 1)", causes: ["Fuga de vácuo", "MAF sujo", "Pressão de combustível baixa", "Injectores obstruídos"], firstChecks: ["Verificar fuel trims", "Testar fuga de ar", "Medir pressão de combustível"] },
  { code: "P0172", title: "Mistura rica (banco 1)", causes: ["Injector com fuga", "Sonda lambda com falha", "Pressão de combustível alta", "Filtro de ar sujo"], firstChecks: ["Verificar fuel trims negativos", "Inspeccionar injectores", "Testar sonda lambda"] },
  { code: "P0128", title: "Termostato abaixo da temperatura de regulação", causes: ["Termostato aberto", "Sensor de temperatura com falha", "Nível de líquido baixo"], firstChecks: ["Comparar temperatura real com a lida", "Verificar nível e termostato"] },
  { code: "P0442", title: "Fuga pequena no sistema EVAP", causes: ["Tampa do depósito mal fechada", "Mangueira EVAP rachada", "Válvula de purga com falha"], firstChecks: ["Verificar tampa do depósito", "Teste de pressão EVAP", "Inspeccionar mangueiras"] },
  { code: "P0562", title: "Tensão do sistema baixa", causes: ["Alternador com falha", "Bateria fraca", "Cabos/massas com oxidação"], firstChecks: ["Medir carga do alternador", "Testar bateria", "Limpar terminais"] },
];

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

/** Raiz simples para tolerar variações (travão/travões/travagem). */
const root = (word: string) =>
  word
    .replace(/(oes|oes)$/, "ao")
    .replace(/(oes|ao)$/, "ao")
    .replace(/(es|s)$/, "")
    .slice(0, 4);

export function searchRepairKnowledge(query: string): RepairArticle[] {
  const terms = tokenize(query).map(root);
  if (terms.length === 0) return [];

  return REPAIR_ARTICLES.map((article) => {
    const haystack = tokenize(
      [article.title, article.category, ...article.symptoms, ...article.tags, ...(article.obdCodes ?? [])].join(" "),
    ).map(root);
    const score = terms.reduce(
      (total, term) => total + (haystack.some((word) => word === term || word.startsWith(term) || term.startsWith(word)) ? 1 : 0),
      0,
    );
    return { article, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.article);
}

export function getArticle(id: string): RepairArticle | null {
  return REPAIR_ARTICLES.find((article) => article.id === id) ?? null;
}

export function getObdCode(code: string): ObdCodeInfo | null {
  return OBD_CODES.find((item) => item.code === code.toUpperCase()) ?? null;
}
