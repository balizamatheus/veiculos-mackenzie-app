import { memo, forwardRef } from 'react';
import { 
  Car, 
  Hash, 
  Users, 
  Mail, 
  Phone,
  Baby,
  Home,
  Calendar
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

// Função auxiliar para converter qualquer valor para string de forma segura
const safeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Componente para destacar texto
const HighlightText = ({ text, highlight, shouldHighlight = true, exactMatch = false }) => {
  // Garante que text seja string
  const safeText = safeString(text);
  if (!shouldHighlight || !highlight || !safeText) return safeText;
  
  const textLower = safeText.toLowerCase();
  const highlightLower = highlight.toLowerCase();
  
  // Se for busca exata, só destaca se for exatamente igual
  if (exactMatch) {
    if (textLower === highlightLower) {
      return <mark className="bg-yellow-200 text-slate-900 rounded px-0.5">{safeText}</mark>;
    }
    return safeText;
  }
  
  // Busca parcial - destaca onde encontrar
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = safeText.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const VehicleCard = memo(forwardRef(({ vehicle, searchQuery, searchMode, exactMatch }, ref) => {
  // Extrair veículos (até 5 por família)
  const veiculos = [];
  for (let i = 1; i <= 5; i++) {
    const placa = vehicle[`Placa${i}`];
    const adesivo = vehicle[`Adesivo${i}`];
    const marcaModelo = vehicle[`Marca/Modelo${i}`];
    if (placa || adesivo) {
      veiculos.push({ placa, adesivo, marcaModelo });
    }
  }

  // Extrair alunos/filhos (até 4)
  const alunos = [];
  for (let i = 1; i <= 4; i++) {
    const aluno = vehicle[`Aluno${i}`];
    const serie = vehicle[`SÉRIE${i}`] || vehicle[`SERIE${i}`];
    if (aluno) {
      alunos.push({ nome: aluno, serie });
    }
  }

  // Dados dos responsáveis
  const anoCadastro = vehicle.Anocadastro;
  const pai = vehicle.Pai;
  const mae = vehicle.Mãe;
  const emailPai = vehicle['Email Pai'];
  const emailMae = vehicle['Email Mãe'];
  const celular = vehicle.Celular;
  const telefoneResidencial = vehicle['Telefone Residencial'];
  const identificacao = vehicle.Identificação;

  // Se modo adesivo, só destaca nos adesivos
  const isAdesivoMode = searchMode === 'adesivo';

  return (
    <div ref={ref} className={cn(
      "bg-white rounded-2xl p-4 border border-slate-100",
      "hover:border-primary-100 transition-colors"
    )}>
      {/* Header com Ano Cadastro e Identificação */}
      <div className="mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {anoCadastro && (
            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              <Calendar className="w-3 h-3" />
              <span>{anoCadastro}</span>
            </div>
          )}
          {identificacao && (
            <p className="text-sm font-semibold text-primary-600">
              <HighlightText 
                text={identificacao} 
                highlight={searchQuery} 
                shouldHighlight={!isAdesivoMode}
                exactMatch={exactMatch}
              />
            </p>
          )}
        </div>
      </div>

      {/* Veículos */}
      <div className="space-y-2 mb-3">
        {veiculos.map((v, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Car className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  <HighlightText 
                    text={v.placa || 'N/A'} 
                    highlight={searchQuery}
                    shouldHighlight={!isAdesivoMode}
                    exactMatch={exactMatch}
                  />
                </p>
                {v.marcaModelo && (
                  <p className="text-xs text-slate-400">
                    <HighlightText 
                      text={v.marcaModelo} 
                      highlight={searchQuery}
                      shouldHighlight={!isAdesivoMode}
                      exactMatch={exactMatch}
                    />
                  </p>
                )}
              </div>
            </div>
            
            {v.adesivo && (
              <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                <Hash className="w-3 h-3 mr-1" />
                <HighlightText 
                  text={v.adesivo} 
                  highlight={searchQuery}
                  shouldHighlight={true}
                  exactMatch={exactMatch}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Responsáveis e Alunos */}
      <div className="space-y-2 mb-3">
        {/* Responsáveis */}
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Users className="w-3 h-3 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">Responsáveis</p>
            <div className="space-y-0.5">
              {pai && (
                <p className="text-sm text-slate-700">
                  Pai: <HighlightText text={pai} highlight={searchQuery} shouldHighlight={!isAdesivoMode} exactMatch={exactMatch} />
                </p>
              )}
              {mae && (
                <p className="text-sm text-slate-700">
                  Mãe: <HighlightText text={mae} highlight={searchQuery} shouldHighlight={!isAdesivoMode} exactMatch={exactMatch} />
                </p>
              )}
              {!pai && !mae && (
                <p className="text-sm text-slate-400 italic">Não informado</p>
              )}
            </div>
          </div>
        </div>

        {/* Alunos */}
        {alunos.length > 0 && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Baby className="w-3 h-3 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">Alunos</p>
              <div className="space-y-0.5">
                {alunos.map((aluno, idx) => (
                  <p key={idx} className="text-sm text-slate-700">
                    <HighlightText text={aluno.nome} highlight={searchQuery} shouldHighlight={!isAdesivoMode} exactMatch={exactMatch} />
                    {aluno.serie && <span className="text-slate-400 ml-1">({aluno.serie})</span>}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contatos */}
      <div className="pt-3 border-t border-slate-100">
        <div className="space-y-1.5">
          {celular && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-3 h-3 text-green-500" />
              </div>
              <p className="text-sm text-slate-700">
                <HighlightText text={celular} highlight={searchQuery} shouldHighlight={!isAdesivoMode} exactMatch={exactMatch} />
              </p>
            </div>
          )}
          
          {telefoneResidencial && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Home className="w-3 h-3 text-slate-500" />
              </div>
              <p className="text-sm text-slate-700">
                <HighlightText text={telefoneResidencial} highlight={searchQuery} shouldHighlight={!isAdesivoMode} exactMatch={exactMatch} />
              </p>
            </div>
          )}
          
          {emailPai && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-3 h-3 text-blue-500" />
              </div>
              <p className="text-sm text-slate-700 break-all">
                <HighlightText text={emailPai} highlight={searchQuery} shouldHighlight={!isAdesivoMode} exactMatch={exactMatch} />
              </p>
            </div>
          )}
          
          {emailMae && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-3 h-3 text-blue-500" />
              </div>
              <p className="text-sm text-slate-700 break-all">
                <HighlightText text={emailMae} highlight={searchQuery} shouldHighlight={!isAdesivoMode} exactMatch={exactMatch} />
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}));

VehicleCard.displayName = 'VehicleCard';

export default VehicleCard;
