'use strict';

/* =========================================================
   Animações dos exercícios — bonequinho de traço em canvas.
   Cada padrão de movimento tem 2+ poses-chave; o desenho
   interpola entre elas em loop.

   Vista lateral (olhando para a direita):
     ângulos absolutos em graus: 0 = para baixo, 90 = para frente,
     180 = para cima, 270 = para trás.
     torso: 0 = em pé, positivo = inclinado para frente.
     Membros por ângulos [segmento1, segmento2] ou por alvo [x, y] (IK).
   Vista frontal: membros por [ângulo, escala] (escala < 1 = apontando
     para a câmera), ângulo positivo = para fora do corpo.
   ========================================================= */

(function () {
  const L = { torso: 46, neck: 7, head: 8.5, ua: 25, fa: 23, th: 32, sh: 32, foot: 9 };
  const FLOOR = 150;

  const dir = (a) => { const r = (a * Math.PI) / 180; return [Math.sin(r), Math.cos(r)]; };
  const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];

  function ik(A, T, l1, l2, sign) {
    const dx = T[0] - A[0], dy = T[1] - A[1];
    const raw = Math.hypot(dx, dy);
    const d = Math.min(Math.max(raw, Math.abs(l1 - l2) + 0.1), l1 + l2 - 0.01);
    const base = Math.atan2(dy, dx);
    const a = base + sign * Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
    const J = [A[0] + l1 * Math.cos(a), A[1] + l1 * Math.sin(a)];
    const ex = T[0] - J[0], ey = T[1] - J[1], el = Math.hypot(ex, ey) || 1;
    return [J, [J[0] + (ex / el) * l2, J[1] + (ey / el) * l2]];
  }

  /* ---------- Poses ---------- */

  const stand = { view: 'side', hip: [100, 86], torso: 0, aN: [3, 3], aF: [-3, -3], lN: [0, 0], lF: [0, 0], ftN: 90, ftF: 90, eN: 1, eF: 1, kN: -1, kF: -1 };
  const P = (o) => ({ ...stand, ...o });
  const F = (o) => ({ view: 'front', seated: false, arm: [6, 1, 6, 1], leg: [4, 1, 2, 1], ...o });

  const PATTERNS = {
    pulldown: {
      title: 'Puxada', hl: ['arm'],
      props: [{ k: 'seat', x: 66, y: 108, w: 40 }, { k: 'pad', at: 'kN', r: 5, dy: -6 }, { k: 'cable', from: [92, -6], to: 'hN' }, { k: 'bar', at: 'hN', w: 30 }],
      poses: [
        P({ hip: [86, 104], torso: -12, aN: [172, 178], aF: [170, 176], fN: [126, 150], fF: [122, 150] }),
        P({ hip: [86, 104], torso: -16, aN: [18, 168], aF: [14, 165], fN: [126, 150], fF: [122, 150] }),
      ],
      tips: ['Peito para cima e ombros longe das orelhas.', 'Puxe a barra até o alto do peito levando os cotovelos para baixo.', 'Suba devagar até esticar os braços.'],
    },
    rowSeated: {
      title: 'Remada baixa', hl: ['arm'],
      props: [{ k: 'seat', x: 50, y: 130, w: 50 }, { k: 'block', x: 140, y: 124, w: 8, h: 26 }, { k: 'cable', from: [150, 112], to: 'hN' }, { k: 'handle', at: 'hN' }],
      poses: [
        P({ hip: [80, 126], torso: 4, aN: [86, 88], aF: [84, 86], fN: [140, 138], fF: [138, 140] }),
        P({ hip: [80, 126], torso: -6, aN: [-40, 88], aF: [-44, 86], fN: [140, 138], fF: [138, 140] }),
      ],
      tips: ['Coluna reta: não balance o tronco para puxar.', 'Leve os cotovelos para trás, rente ao corpo.', 'Aperte as escápulas no final e volte devagar.'],
    },
    rowBent: {
      title: 'Remada apoiada', hl: ['arm'],
      props: [{ k: 'beam', a: [84, 118], b: [128, 76], w: 7 }, { k: 'leg', a: [96, 112], b: [96, 150] }, { k: 'db', at: 'hN' }],
      poses: [
        P({ hip: [84, 100], torso: 52, aN: [2, 0], aF: [-2, -2], fN: [70, 150], fF: [64, 150], kN: -1, kF: -1 }),
        P({ hip: [84, 100], torso: 52, aN: [-82, 0], aF: [-2, -2], fN: [70, 150], fF: [64, 150], kN: -1, kF: -1 }),
      ],
      tips: ['Peito apoiado no banco protege a lombar.', 'Puxe o cotovelo em direção ao quadril.', 'Não gire o tronco para subir o peso.'],
    },
    facePull: {
      title: 'Face pull', hl: ['arm'],
      props: [{ k: 'cableF', from: [100, 34], to: 'hands' }],
      poses: [
        F({ arm: [84, 0.35, 86, 0.3] }),
        F({ arm: [92, 1, 178, 1] }),
      ],
      tips: ['Polia na altura do rosto, corda com as duas mãos.', 'Puxe abrindo os cotovelos e leve as mãos ao lado das orelhas.', 'Ótimo para os ombros que rodam para dentro.'],
    },
    reverseFly: {
      title: 'Crucifixo inverso', hl: ['arm'],
      props: [{ k: 'dbF', at: 'hands' }],
      poses: [
        F({ arm: [80, 0.3, 80, 0.3] }),
        F({ arm: [88, 1, 90, 1] }),
      ],
      tips: ['Braços quase esticados, cotovelos levemente dobrados.', 'Abra até a linha dos ombros, sem subir os ombros.', 'Carga leve: quem trabalha é o fundo do ombro.'],
    },
    fly: {
      title: 'Crucifixo na polia', hl: ['arm'],
      props: [{ k: 'cableF', from: [176, 6], to: 'hands', both: true }],
      poses: [
        F({ arm: [100, 1, 108, 1] }),
        F({ arm: [62, 0.35, 50, 0.3] }),
      ],
      tips: ['Cotovelos levemente dobrados o tempo todo.', 'Feche os braços num arco, como num abraço.', 'Volte devagar até sentir o peito alongar.'],
    },
    curl: {
      title: 'Rosca', hl: ['arm'],
      props: [{ k: 'db', at: 'hN' }, { k: 'db', at: 'hF', far: true }],
      poses: [P({ aN: [2, 2], aF: [-2, -2] }), P({ aN: [6, 150], aF: [2, 146] })],
      tips: ['Cotovelos colados ao corpo.', 'Suba sem jogar o tronco para trás.', 'Desça devagar, controlando o peso.'],
    },
    scott: {
      title: 'Rosca Scott', hl: ['arm'],
      props: [{ k: 'seat', x: 72, y: 114, w: 34 }, { k: 'beam', a: [102, 82], b: [126, 104], w: 7 }, { k: 'leg', a: [116, 98], b: [116, 150] }, { k: 'db', at: 'hN' }],
      poses: [
        P({ hip: [88, 110], torso: 14, aN: [44, 42], aF: [42, 40], fN: [118, 150], fF: [114, 150] }),
        P({ hip: [88, 110], torso: 14, aN: [44, 160], aF: [42, 158], fN: [118, 150], fF: [114, 150] }),
      ],
      tips: ['Braço todo apoiado no banco.', 'Não estique o cotovelo de forma brusca embaixo.', 'Suba até a contração e desça em 2 a 3 segundos.'],
    },
    pushdown: {
      title: 'Tríceps na polia', hl: ['arm'],
      props: [{ k: 'cable', from: [126, -6], to: 'hN' }, { k: 'handle', at: 'hN' }],
      poses: [P({ torso: 8, aN: [6, 160], aF: [2, 156] }), P({ torso: 8, aN: [6, 4], aF: [2, 2] })],
      tips: ['Cotovelos parados ao lado do corpo.', 'Estique os braços por completo embaixo.', 'Tronco firme, sem empurrar com os ombros.'],
    },
    overhead: {
      title: 'Tríceps francês', hl: ['arm'],
      props: [{ k: 'seat', x: 70, y: 108, w: 36 }, { k: 'db', at: 'hN' }],
      poses: [
        P({ hip: [88, 104], torso: 0, aN: [172, 332], aF: [172, 332], fN: [122, 150], fF: [118, 150] }),
        P({ hip: [88, 104], torso: 0, aN: [172, 182], aF: [172, 182], fN: [122, 150], fF: [118, 150] }),
      ],
      tips: ['Sentado com as costas apoiadas e abdômen firme.', 'Cotovelos apontando para cima, sem abrir.', 'Não arqueie a lombar ao subir o peso.'],
    },
    incline: {
      title: 'Supino inclinado', hl: ['arm'],
      props: [{ k: 'beam', a: [92, 116], b: [50, 70], w: 7 }, { k: 'seat', x: 86, y: 116, w: 26 }, { k: 'leg', a: [96, 120], b: [96, 150] }, { k: 'db', at: 'hN' }],
      poses: [
        P({ hip: [88, 110], torso: -42, aN: [8, 132], aF: [6, 130], fN: [126, 150], fF: [122, 150] }),
        P({ hip: [88, 110], torso: -42, aN: [132, 132], aF: [130, 130], fN: [126, 150], fF: [122, 150] }),
      ],
      tips: ['Escápulas juntas e apoiadas no banco.', 'Desça até a linha do peito com os cotovelos a uns 45°.', 'Pés firmes no chão, sem tirar o quadril do banco.'],
    },
    flat: {
      title: 'Supino', hl: ['arm'],
      props: [{ k: 'beam', a: [56, 128], b: [126, 128], w: 7 }, { k: 'leg', a: [70, 131], b: [70, 150] }, { k: 'leg', a: [114, 131], b: [114, 150] }, { k: 'bar', at: 'hN', w: 6, plate: true }],
      poses: [
        P({ hip: [116, 120], torso: -90, aN: [18, 178], aF: [14, 176], fN: [146, 150], fF: [142, 150] }),
        P({ hip: [116, 120], torso: -90, aN: [178, 178], aF: [176, 176], fN: [146, 150], fF: [142, 150] }),
      ],
      tips: ['Escápulas juntas e peito aberto.', 'Desça controlando até perto do peito.', 'Empurre sem tirar o quadril do banco.'],
    },
    press: {
      title: 'Desenvolvimento', hl: ['arm'],
      props: [{ k: 'seatF' }, { k: 'dbF', at: 'hands', vertical: true }],
      poses: [F({ seated: true, arm: [92, 1, 176, 1] }), F({ seated: true, arm: [160, 1, 172, 1] })],
      tips: ['Sentado com as costas apoiadas.', 'Comece com os halteres na altura das orelhas.', 'Suba sem arquear a lombar.'],
    },
    lateral: {
      title: 'Elevação lateral', hl: ['arm'],
      props: [{ k: 'dbF', at: 'hands' }],
      poses: [F({ arm: [10, 1, 12, 1] }), F({ arm: [84, 1, 88, 1] })],
      tips: ['Cotovelos levemente dobrados.', 'Suba até a altura dos ombros, não acima.', 'Carga leve e sem balançar o corpo.'],
    },
    extRot: {
      title: 'Rotação externa', hl: ['arm'],
      props: [{ k: 'bandF', at: 'hands' }],
      poses: [F({ arm: [4, 1, -70, 0.55] }), F({ arm: [4, 1, 82, 0.95] })],
      tips: ['Cotovelo colado ao corpo, dobrado a 90°.', 'Gire o antebraço para fora, devagar.', 'Use elástico leve: o objetivo é postura, não força.'],
    },
    legPress: {
      title: 'Leg press', hl: ['leg'],
      props: [{ k: 'beam', a: [76, 132], b: [36, 92], w: 7 }, { k: 'rail', a: [96, 140], b: [168, 68] }, { k: 'platform', at: 'ankN' }],
      poses: [
        P({ hip: [72, 124], torso: -50, aN: [20, 30], aF: [18, 28], fN: [104, 96], fF: [102, 98], kN: -1, kF: -1 }),
        P({ hip: [72, 124], torso: -50, aN: [20, 30], aF: [18, 28], fN: [120, 80], fF: [118, 82], kN: -1, kF: -1 }),
      ],
      tips: ['Lombar sempre encostada no banco.', 'Desça até onde não tirar o quadril do encosto.', 'Não trave os joelhos no alto.'],
    },
    legPressUni: {
      title: 'Leg press unilateral', hl: ['leg'],
      props: [{ k: 'beam', a: [76, 132], b: [36, 92], w: 7 }, { k: 'rail', a: [96, 140], b: [168, 68] }, { k: 'platform', at: 'ankN' }],
      poses: [
        P({ hip: [72, 124], torso: -50, aN: [20, 30], aF: [18, 28], fN: [104, 96], fF: [100, 148], kN: -1, kF: -1 }),
        P({ hip: [72, 124], torso: -50, aN: [20, 30], aF: [18, 28], fN: [120, 80], fF: [100, 148], kN: -1, kF: -1 }),
      ],
      tips: ['Comece pela perna esquerda, a mais fraca.', 'Faça as mesmas repetições com a direita.', 'Lombar encostada e joelho alinhado com o pé.'],
    },
    split: {
      title: 'Agachamento búlgaro', hl: ['leg'],
      props: [{ k: 'box', x: 22, y: 116, w: 30, h: 34 }, { k: 'db', at: 'hN' }],
      poses: [
        P({ hip: [94, 88], torso: 8, aN: [4, 4], aF: [0, 0], fN: [124, 150], fF: [46, 116], kN: -1, kF: -1, ftF: 200 }),
        P({ hip: [90, 112], torso: 14, aN: [4, 4], aF: [0, 0], fN: [124, 150], fF: [46, 116], kN: -1, kF: -1, ftF: 200 }),
      ],
      tips: ['Comece pela perna esquerda.', 'Desça reto, joelho da frente alinhado com o pé.', 'Tronco levemente inclinado e abdômen firme.'],
    },
    squat: {
      title: 'Agachamento', hl: ['leg'],
      props: [{ k: 'db', at: 'hN' }],
      poses: [
        P({ hip: [100, 86], torso: 4, aN: [6, 140], aF: [4, 138], fN: [104, 150], fF: [100, 150] }),
        P({ hip: [80, 114], torso: 36, aN: [40, 150], aF: [38, 148], fN: [104, 150], fF: [100, 150] }),
      ],
      tips: ['Peso no meio do pé e calcanhar no chão.', 'Joelhos na direção dos pés.', 'Coluna neutra; com dor lombar, prefira o leg press.'],
    },
    legExt: {
      title: 'Cadeira extensora', hl: ['leg'],
      props: [{ k: 'seat', x: 70, y: 114, w: 50 }, { k: 'beam', a: [70, 112], b: [62, 68], w: 7 }, { k: 'pad', at: 'ankN', r: 5, dx: 4 }],
      poses: [
        P({ hip: [86, 110], torso: -10, lN: [90, 8], lF: [88, 6], aN: [10, 30], aF: [8, 28] }),
        P({ hip: [86, 110], torso: -10, lN: [90, 86], lF: [88, 84], aN: [10, 30], aF: [8, 28] }),
      ],
      tips: ['Costas encostadas e quadril no fundo do banco.', 'Estique o joelho e segure 1 segundo no alto.', 'Desça devagar, sem deixar o peso bater.'],
    },
    legCurlSeated: {
      title: 'Cadeira flexora', hl: ['leg'],
      props: [{ k: 'seat', x: 70, y: 114, w: 50 }, { k: 'beam', a: [70, 112], b: [62, 68], w: 7 }, { k: 'pad', at: 'ankN', r: 5, dx: 5 }, { k: 'pad', at: 'kN', r: 4, dy: -7 }],
      poses: [
        P({ hip: [86, 110], torso: -10, lN: [90, 80], lF: [88, 78], aN: [10, 30], aF: [8, 28] }),
        P({ hip: [86, 110], torso: -10, lN: [90, -12], lF: [88, -14], aN: [10, 30], aF: [8, 28] }),
      ],
      tips: ['Joelho alinhado com o eixo da máquina.', 'Dobre os joelhos levando o calcanhar para baixo do banco.', 'Volte devagar.'],
    },
    legCurlLying: {
      title: 'Mesa flexora', hl: ['leg'],
      props: [{ k: 'beam', a: [44, 126], b: [132, 126], w: 7 }, { k: 'leg', a: [60, 129], b: [60, 150] }, { k: 'leg', a: [118, 129], b: [118, 150] }, { k: 'pad', at: 'ankN', r: 5, dy: -5 }],
      poses: [
        P({ hip: [100, 118], torso: -90, lN: [90, 90], lF: [90, 90], aN: [8, 60], aF: [6, 58] }),
        P({ hip: [100, 118], torso: -90, lN: [90, 196], lF: [90, 192], aN: [8, 60], aF: [6, 58] }),
      ],
      tips: ['Quadril colado no banco: não levante o bumbum.', 'Dobre os joelhos até perto de 90° ou mais.', 'Desça devagar, sem soltar.'],
    },
    calf: {
      title: 'Panturrilha em pé', hl: ['leg'],
      props: [{ k: 'db', at: 'hN' }],
      poses: [P({ ftN: 90, ftF: 90 }), P({ hip: [100, 80], ftN: 36, ftF: 36 })],
      tips: ['Suba o máximo que conseguir na ponta dos pés.', 'Segure 1 segundo no alto.', 'Desça devagar até alongar.'],
    },
    calfSeated: {
      title: 'Panturrilha sentado', hl: ['leg'],
      props: [{ k: 'seat', x: 62, y: 114, w: 44 }, { k: 'pad', at: 'kN', r: 5, dy: -7 }],
      poses: [
        P({ hip: [86, 110], torso: 4, lN: [90, 0], lF: [88, -2], ftN: 90, ftF: 90, aN: [30, 60], aF: [28, 58] }),
        P({ hip: [86, 110], torso: 4, lN: [79, -6], lF: [77, -8], ftN: 38, ftF: 38, aN: [30, 60], aF: [28, 58] }),
      ],
      tips: ['Pontas dos pés na plataforma e calcanhar livre.', 'Suba ao máximo e segure 1 segundo.', 'Desça até alongar bem.'],
    },
    hipThrust: {
      title: 'Elevação pélvica', hl: ['leg'],
      props: [{ k: 'box', x: 16, y: 114, w: 34, h: 36 }, { k: 'bar', at: 'hip', w: 6, plate: true, dy: -5 }],
      poses: [
        P({ hip: [86, 136], torso: -55.6, fN: [126, 150], fF: [122, 150], aN: [40, 80], aF: [38, 78], kN: 1, kF: 1 }),
        P({ hip: [94, 110], torso: -90, fN: [126, 150], fF: [122, 150], aN: [150, 92], aF: [148, 90], kN: 1, kF: 1 }),
      ],
      tips: ['Costas apoiadas no banco na altura das escápulas.', 'Suba contraindo o glúteo, sem arquear a lombar.', 'No alto, joelhos a 90° e queixo para baixo.'],
    },
    rdl: {
      title: 'Stiff', hl: ['leg'],
      props: [{ k: 'db', at: 'hN' }],
      poses: [
        P({ hip: [100, 86], torso: 0, aN: [0, 0], aF: [0, 0], fN: [104, 150], fF: [100, 150] }),
        P({ hip: [88, 90], torso: 72, aN: [0, 0], aF: [0, 0], fN: [104, 150], fF: [100, 150] }),
      ],
      tips: ['Empurre o quadril para trás, joelhos levemente dobrados.', 'Coluna neutra do começo ao fim.', 'Desça só até onde a coluna fica reta; pare se doer.'],
    },
    abductor: {
      title: 'Cadeira abdutora', hl: ['leg'],
      props: [{ k: 'seatF' }, { k: 'padF', at: 'knees' }],
      poses: [F({ seated: true, arm: [20, 0.6, 10, 0.5], leg: [8, 0.4, 2, 1] }), F({ seated: true, arm: [20, 0.6, 10, 0.5], leg: [64, 0.62, 10, 1] })],
      tips: ['Costas encostadas no banco.', 'Abra as pernas de forma controlada.', 'Segure 1 segundo aberto e volte devagar.'],
    },
    deadbug: {
      title: 'Dead bug', hl: ['arm', 'leg', 'torso'],
      props: [],
      poses: [
        P({ hip: [112, 142], torso: -90, aN: [180, 180], aF: [180, 180], lN: [180, 90], lF: [180, 90] }),
        P({ hip: [112, 142], torso: -90, aN: [252, 256], aF: [180, 180], lN: [180, 90], lF: [100, 96] }),
      ],
      tips: ['Lombar colada no chão o tempo todo.', 'Estique um braço e a perna oposta, devagar.', 'Volte e troque o lado. Respire saindo o ar.'],
    },
    birddog: {
      title: 'Bird dog', hl: ['arm', 'leg', 'torso'],
      props: [],
      poses: [
        P({ hip: [124, 118], torso: -92, aN: [358, 4], aF: [2, 6], lN: [0, 90], lF: [0, 90], ftN: 90, ftF: 90 }),
        P({ hip: [124, 118], torso: -92, aN: [266, 268], aF: [2, 6], lN: [0, 90], lF: [96, 94], ftN: 90, ftF: 90 }),
      ],
      tips: ['Apoio de mãos e joelhos, coluna reta.', 'Estique um braço e a perna oposta sem girar o quadril.', 'Segure 2 segundos e troque o lado.'],
    },
    plank: {
      title: 'Prancha lateral', hl: ['torso'],
      props: [],
      poses: [
        P({ hip: [92, 130], torso: -70, aN: [6, 268], aF: [150, 150], lN: [70, 70], lF: [68, 68], ftN: 160, ftF: 160 }),
        P({ hip: [92, 126], torso: -72, aN: [6, 268], aF: [150, 150], lN: [72, 72], lF: [70, 70], ftN: 160, ftF: 160 }),
      ],
      tips: ['Cotovelo embaixo do ombro.', 'Corpo em linha reta, quadril alto.', 'Conte os segundos da meta e troque o lado.'],
    },
    pallof: {
      title: 'Pallof press', hl: ['arm', 'torso'],
      props: [{ k: 'cable', from: [18, 66], to: 'hN' }, { k: 'handle', at: 'hN' }],
      poses: [P({ aN: [12, 152], aF: [10, 150], fN: [108, 150], fF: [92, 150] }), P({ aN: [88, 90], aF: [86, 88], fN: [108, 150], fF: [92, 150] })],
      tips: ['Polia ao seu lado, na altura do peito.', 'Empurre as mãos para frente sem deixar o tronco girar.', 'Segure 2 segundos e volte.'],
    },
  };

  const RULES = [
    ['puxada', 'pulldown'], ['remada baixa', 'rowSeated'], ['remada', 'rowBent'], ['face pull', 'facePull'],
    ['crucifixo inverso', 'reverseFly'], ['crucifixo', 'fly'], ['rosca scott', 'scott'], ['rosca', 'curl'],
    ['frances', 'overhead'], ['triceps', 'pushdown'], ['supino inclinado', 'incline'], ['supino', 'flat'],
    ['desenvolvimento', 'press'], ['elevacao lateral', 'lateral'], ['elevacao pelvica', 'hipThrust'],
    ['rotacao externa', 'extRot'], ['leg press unilateral', 'legPressUni'], ['leg press', 'legPress'],
    ['bulgaro', 'split'], ['agachamento', 'squat'], ['extensora', 'legExt'], ['mesa flexora', 'legCurlLying'],
    ['flexora', 'legCurlSeated'], ['panturrilha sentado', 'calfSeated'], ['panturrilha', 'calf'],
    ['stiff', 'rdl'], ['terra romeno', 'rdl'], ['abdutora', 'abductor'], ['dead bug', 'deadbug'],
    ['bird dog', 'birddog'], ['prancha', 'plank'], ['pallof', 'pallof'],
  ];

  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function animFor(name) {
    const n = norm(name);
    const r = RULES.find(([k]) => n.includes(k));
    return r ? r[1] : null;
  }

  /* ---------- Interpolação ---------- */

  function lerp(a, b, t) {
    if (typeof a === 'number') return a + (b - a) * t;
    if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], t));
    return a;
  }
  function blend(p1, p2, t) {
    const out = {};
    for (const k of Object.keys(p1)) out[k] = k in p2 ? lerp(p1[k], p2[k], t) : p1[k];
    return out;
  }
  function poseAt(pattern, phase) {
    // phase 0..1: ida e volta pelas poses, com suavização
    const ps = pattern.poses;
    const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    const eased = (1 - Math.cos(Math.PI * tri)) / 2;
    const pos = eased * (ps.length - 1);
    const i = Math.min(ps.length - 2, Math.floor(pos));
    return blend(ps[i], ps[i + 1], pos - i);
  }

  /* ---------- Esqueleto ---------- */

  function solveSide(p) {
    const j = { hip: p.hip };
    const td = [Math.sin((p.torso * Math.PI) / 180), -Math.cos((p.torso * Math.PI) / 180)];
    j.sh = add(p.hip, td, L.torso);
    j.head = add(j.sh, td, L.neck + L.head);
    for (const s of ['N', 'F']) {
      const ang = p['a' + s];
      if (p['h' + s]) {
        [j['e' + s], j['h' + s]] = ik(j.sh, p['h' + s], L.ua, L.fa, p['e' + s]);
      } else {
        j['e' + s] = add(j.sh, dir(ang[0]), L.ua);
        j['h' + s] = add(j['e' + s], dir(ang[1]), L.fa);
      }
      if (p['f' + s]) {
        [j['k' + s], j['ank' + s]] = ik(p.hip, p['f' + s], L.th, L.sh, p['k' + s]);
      } else {
        const lg = p['l' + s];
        j['k' + s] = add(p.hip, dir(lg[0]), L.th);
        j['ank' + s] = add(j['k' + s], dir(lg[1]), L.sh);
      }
      j['toe' + s] = add(j['ank' + s], dir(p['ft' + s]), L.foot);
    }
    return j;
  }

  function solveFront(p) {
    const cx = 100;
    const shY = p.seated ? 66 : 40, hipY = shY + L.torso;
    const j = { neck: [cx, shY - 3], head: [cx, shY - 3 - L.neck - L.head + 3], pelvis: [cx, hipY], sides: [] };
    for (const s of [1, -1]) {
      const sh = [cx + s * 15, shY], hp = [cx + s * 8, hipY];
      const [ua, us, fa, fs] = p.arm, [ta, ts, sa, ss] = p.leg;
      const e = [sh[0] + s * Math.sin((ua * Math.PI) / 180) * L.ua * us, sh[1] + Math.cos((ua * Math.PI) / 180) * L.ua * us];
      const h = [e[0] + s * Math.sin((fa * Math.PI) / 180) * L.fa * fs, e[1] + Math.cos((fa * Math.PI) / 180) * L.fa * fs];
      const k = [hp[0] + s * Math.sin((ta * Math.PI) / 180) * L.th * ts, hp[1] + Math.cos((ta * Math.PI) / 180) * L.th * ts];
      let a = [k[0] + s * Math.sin((sa * Math.PI) / 180) * L.sh * ss, k[1] + Math.cos((sa * Math.PI) / 180) * L.sh * ss];
      if (p.seated) a = [a[0], Math.min(a[1], FLOOR)];
      j.sides.push({ s, sh, e, h, hp, k, a });
    }
    return j;
  }

  /* ---------- Desenho ---------- */

  function draw(ctx, key, phase, C) {
    const pat = PATTERNS[key];
    const pose = poseAt(pat, phase);
    const W = 200, H = 170;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.translate(0, 12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const line = (a, b, color, w) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
    const poly = (pts, color, w) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); };
    const dot = (p, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill(); };
    const rrect = (x, y, w, h, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };

    // chão
    line([14, FLOOR + 1.5], [186, FLOOR + 1.5], C.floor, 2);

    const hl = (part) => pat.hl.includes(part);
    const LW = 5.5;

    if (pose.view === 'side') {
      const j = solveSide(pose);
      const ref = (at) => j[at] || pose.hip;
      const props = pat.props;
      const drawProp = (pr) => {
        switch (pr.k) {
          case 'seat': rrect(pr.x, pr.y, pr.w, 6, 3, C.equip); line([pr.x + pr.w / 2, pr.y + 6], [pr.x + pr.w / 2, FLOOR], C.equip, 3); break;
          case 'beam': line(pr.a, pr.b, C.equip, pr.w); break;
          case 'leg': line(pr.a, pr.b, C.equip, 3); break;
          case 'rail': line(pr.a, pr.b, C.floor, 2); break;
          case 'box': rrect(pr.x, pr.y, pr.w, pr.h, 4, C.equip); break;
          case 'block': rrect(pr.x, pr.y, pr.w, pr.h, 2, C.equip); break;
          case 'cable': { const t = ref(pr.to); line(pr.from, t, C.cable, 1.6); dot(pr.from, 3.5, C.cable); break; }
          case 'pad': { const p = ref(pr.at); dot([p[0] + (pr.dx || 0), p[1] + (pr.dy || 0)], pr.r, C.equip); break; }
          case 'platform': {
            const p = j.ankN, d = [Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)];
            line([p[0] - d[0] * 15 + 3, p[1] - d[1] * 15 + 3], [p[0] + d[0] * 15 + 3, p[1] + d[1] * 15 + 3], C.equip, 6);
            break;
          }
          default: break;
        }
      };
      const drawHeld = (pr) => {
        const p = ref(pr.at);
        const c = pr.far ? C.equip : C.weight;
        if (pr.k === 'db') { rrect(p[0] - 6, p[1] - 3.5, 12, 7, 3, c); }
        if (pr.k === 'handle') dot(p, 3.2, C.cable);
        if (pr.k === 'bar') {
          const y = p[1] + (pr.dy || 0);
          if (pr.plate) dot([p[0], y], 10, C.weight);
          else line([p[0] - pr.w / 2, y], [p[0] + pr.w / 2, y], C.weight, 3.5);
        }
      };
      props.filter((pr) => !['db', 'handle', 'bar'].includes(pr.k)).forEach(drawProp);

      // membros de trás
      poly([j.hip, j.kF, j.ankF, j.toeF], C.far, LW);
      poly([j.sh, j.eF, j.hF], C.far, LW);
      props.filter((pr) => ['db', 'handle', 'bar'].includes(pr.k) && pr.far).forEach(drawHeld);
      // tronco e cabeça
      line(j.hip, j.sh, hl('torso') ? C.hl : C.body, LW + 1);
      dot(j.head, L.head, C.body);
      // membros da frente
      poly([j.hip, j.kN, j.ankN, j.toeN], hl('leg') ? C.hl : C.body, LW);
      poly([j.sh, j.eN, j.hN], hl('arm') ? C.hl : C.body, LW);
      props.filter((pr) => ['db', 'handle', 'bar'].includes(pr.k) && !pr.far).forEach(drawHeld);
    } else {
      const j = solveFront(pose);
      for (const pr of pat.props) {
        if (pr.k === 'seatF') { rrect(70, j.pelvis[1] - 2, 60, 7, 3, C.equip); line([100, j.pelvis[1] + 5], [100, FLOOR], C.equip, 3); rrect(84, j.pelvis[1] - 52, 32, 50, 5, C.back); }
        if (pr.k === 'cableF') j.sides.forEach((sd) => { const from = [100 + sd.s * (pr.from[0] - 100), pr.from[1]]; line(from, sd.h, C.cable, 1.6); dot(from, 3.5, C.cable); });
        if (pr.k === 'bandF') j.sides.forEach((sd) => line(sd.h, [100, sd.h[1]], C.cable, 1.6));
      }
      const [r, l] = j.sides;
      const armC = hl('arm') ? C.hl : C.body, legC = hl('leg') ? C.hl : C.body;
      // pernas
      [r, l].forEach((sd) => poly([sd.hp, sd.k, sd.a, [sd.a[0] + sd.s * 6, sd.a[1]]], legC, LW));
      // tronco
      ctx.fillStyle = C.body;
      line(j.neck, j.pelvis, hl('torso') ? C.hl : C.body, LW + 1);
      line(r.sh, l.sh, C.body, LW);
      line(r.hp, l.hp, C.body, LW);
      dot(j.head, L.head, C.body);
      // braços
      [r, l].forEach((sd) => poly([sd.sh, sd.e, sd.h], armC, LW));
      for (const pr of pat.props) {
        if (pr.k === 'dbF') j.sides.forEach((sd) => (pr.vertical ? rrect(sd.h[0] - 3.5, sd.h[1] - 7, 7, 14, 3, C.weight) : rrect(sd.h[0] - 7, sd.h[1] - 3.5, 14, 7, 3, C.weight)));
        if (pr.k === 'padF') j.sides.forEach((sd) => dot([sd.k[0] + sd.s * 6, sd.k[1]], 4.5, C.equip));
      }
    }
    ctx.restore();
  }

  /* ---------- Player ---------- */

  function colors(el) {
    const cs = getComputedStyle(el);
    const v = (n) => cs.getPropertyValue(n).trim();
    return { body: v('--text'), far: v('--muted'), hl: v('--ring-green'), equip: v('--separator'), back: v('--surface-2'), floor: v('--separator'), cable: v('--ring-cyan'), weight: v('--muted') };
  }

  let raf = null;
  function play(canvas, key) {
    stop();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = 200 * dpr; canvas.height = 170 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const C = colors(canvas);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const period = 2600;
    const t0 = performance.now();
    const frame = (now) => {
      let phase = ((now - t0) % period) / period;
      if (reduce) phase = phase < 0.5 ? 0 : 0.5; // alterna as posições sem movimento contínuo
      draw(ctx, key, phase, C);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

  window.ExAnim = { PATTERNS, animFor, draw, play, stop, colors };
})();
