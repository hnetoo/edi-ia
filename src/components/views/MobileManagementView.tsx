import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Resident {
  id: number;
  name: string;
  unit: string;
  email: string;
  phone: string;
  password: string;
  balance: number;
  building: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface MobileManagementViewProps {
  residents?: Resident[];
  onResidentsUpdate?: (residents: Resident[]) => void;
}

const MobileManagementView: React.FC<MobileManagementViewProps> = ({ 
  residents = [], 
  onResidentsUpdate 
}) => {
  const [residentsList, setResidentsList] = useState<Resident[]>(residents);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [formData, setFormData] = useState<Partial<Resident>>({
    name: '',
    unit: '',
    email: '',
    phone: '',
    password: '',
    balance: 0,
    building: 'Condomínio Primavera',
    address: 'Avenida 21 de Janeiro, 123, Luanda',
    status: 'active'
  });

  useEffect(() => {
    // Carregar moradores do localStorage ou API
    const savedResidents = localStorage.getItem('edi-ia-residents');
    if (savedResidents) {
      setResidentsList(JSON.parse(savedResidents));
    }
  }, []);

  const saveResidents = (updatedResidents: Resident[]) => {
    setResidentsList(updatedResidents);
    localStorage.setItem('edi-ia-residents', JSON.stringify(updatedResidents));
    onResidentsUpdate?.(updatedResidents);
  };

  const handleAddResident = () => {
    if (!formData.name || !formData.unit || !formData.email || !formData.password) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const newResident: Resident = {
      id: Date.now(),
      name: formData.name!,
      unit: formData.unit!,
      email: formData.email!,
      phone: formData.phone || '+244923456789',
      password: formData.password!,
      balance: formData.balance || 0,
      building: formData.building || 'Condomínio Primavera',
      address: formData.address || 'Avenida 21 de Janeiro, 123, Luanda',
      status: formData.status || 'active',
      created_at: new Date().toISOString()
    };

    const updatedResidents = [...residentsList, newResident];
    saveResidents(updatedResidents);
    
    // Reset form
    setFormData({
      name: '',
      unit: '',
      email: '',
      phone: '',
      password: '',
      balance: 0,
      building: 'Condomínio Primavera',
      address: 'Avenida 21 de Janeiro, 123, Luanda',
      status: 'active'
    });
    setShowAddForm(false);
    
    alert('Morador adicionado com sucesso!');
  };

  const handleEditResident = (resident: Resident) => {
    setEditingResident(resident);
    setFormData(resident);
    setShowAddForm(true);
  };

  const handleUpdateResident = () => {
    if (!editingResident) return;

    const updatedResidents = residentsList.map(r => 
      r.id === editingResident.id 
        ? { ...r, ...formData, id: editingResident.id }
        : r
    );

    saveResidents(updatedResidents);
    setEditingResident(null);
    setShowAddForm(false);
    
    alert('Morador atualizado com sucesso!');
  };

  const handleDeleteResident = (id: number) => {
    if (confirm('Tem certeza que deseja remover este morador?')) {
      const updatedResidents = residentsList.filter(r => r.id !== id);
      saveResidents(updatedResidents);
      alert('Morador removido com sucesso!');
    }
  };

  const generateMobileCode = (resident: Resident) => {
    const code = `EDI_IA:1:${resident.id}:${Date.now()}`;
    navigator.clipboard.writeText(code);
    alert(`Código gerado e copiado: ${code}`);
  };

  const exportResidents = () => {
    const dataStr = JSON.stringify(residentsList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `edi-ia-residents-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Lista de moradores exportada com sucesso!');
  };

  const importResidents = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedResidents = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedResidents)) {
          saveResidents(importedResidents);
          alert('Moradores importados com sucesso!');
        } else {
          alert('Formato de arquivo inválido!');
        }
      } catch (error) {
        alert('Erro ao ler arquivo!');
      }
    };
    reader.readAsText(file);
  };

  const deployToMobile = async () => {
    try {
      // Gerar arquivo JSON com moradores para o app mobile
      const mobileData = {
        residents: residentsList,
        building: residentsList[0]?.building || 'Condomínio Primavera',
        address: residentsList[0]?.address || 'Avenida 21 de Janeiro, 123, Luanda',
        currency: 'AOA',
        generated_at: new Date().toISOString()
      };

      // Salvar no localStorage para deploy automático
      localStorage.setItem('edi-ia-mobile-data', JSON.stringify(mobileData));
      
      alert('✅ Dados preparados para deploy no app mobile!\n\n' +
            `Total de moradores: ${residentsList.length}\n` +
            'Os dados foram sincronizados com sucesso.\n\n' +
            'URL do app mobile: https://edi-3hmcxdr29-helder-netos-projects.vercel.app');
    } catch (error) {
      alert('Erro ao preparar dados para deploy!');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Gestão Mobile</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-brand text-black font-bold rounded-lg text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              + Novo Morador
            </button>
            <button
              onClick={exportResidents}
              className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              Exportar
            </button>
            <label className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg text-sm uppercase tracking-widest hover:scale-[1.02] transition-all cursor-pointer">
              Importar
              <input
                type="file"
                accept=".json"
                onChange={importResidents}
                className="hidden"
              />
            </label>
            <button
              onClick={deployToMobile}
              className="px-4 py-2 bg-purple-500 text-white font-bold rounded-lg text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
            >
              Deploy Mobile
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 text-center">
            <h4 className="text-3xl font-bold text-brand mb-2">{residentsList.length}</h4>
            <p className="text-sm text-ink-muted">Total Moradores</p>
          </div>
          <div className="glass-card p-6 text-center">
            <h4 className="text-3xl font-bold text-green-400 mb-2">
              {residentsList.filter(r => r.status === 'active').length}
            </h4>
            <p className="text-sm text-ink-muted">Moradores Ativos</p>
          </div>
          <div className="glass-card p-6 text-center">
            <h4 className="text-3xl font-bold text-red-400 mb-2">
              {residentsList.reduce((sum, r) => sum + (r.balance < 0 ? Math.abs(r.balance) : 0), 0).toLocaleString('pt-AO')}
            </h4>
            <p className="text-sm text-ink-muted">Total em Débito (AOA)</p>
          </div>
          <div className="glass-card p-6 text-center">
            <h4 className="text-3xl font-bold text-blue-400 mb-2">
              {residentsList.reduce((sum, r) => sum + (r.balance > 0 ? r.balance : 0), 0).toLocaleString('pt-AO')}
            </h4>
            <p className="text-sm text-ink-muted">Total em Crédito (AOA)</p>
          </div>
        </div>

        {/* Formulário de Adicionar/Editar */}
        {showAddForm && (
          <div className="glass-card p-8 mb-8">
            <h4 className="text-xl font-bold text-white mb-6">
              {editingResident ? 'Editar Morador' : 'Adicionar Novo Morador'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-ink-muted uppercase font-bold tracking-widest">Nome Completo</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
                  placeholder="João Silva"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-ink-muted uppercase font-bold tracking-widest">Unidade/Apartamento</label>
                <input
                  type="text"
                  value={formData.unit || ''}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
                  placeholder="T2-104"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-ink-muted uppercase font-bold tracking-widest">E-mail</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
                  placeholder="joao.silva@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-ink-muted uppercase font-bold tracking-widest">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
                  placeholder="+244923456789"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-ink-muted uppercase font-bold tracking-widest">Senha de Acesso</label>
                <input
                  type="text"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
                  placeholder="1234"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-ink-muted uppercase font-bold tracking-widest">Saldo Inicial (AOA)</label>
                <input
                  type="number"
                  value={formData.balance || 0}
                  onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-ink-muted uppercase font-bold tracking-widest">Status</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-brand/50 outline-none appearance-none"
                >
                  <option value="active" className="bg-surface-dark">Ativo</option>
                  <option value="inactive" className="bg-surface-dark">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={editingResident ? handleUpdateResident : handleAddResident}
                className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
              >
                {editingResident ? 'Atualizar' : 'Adicionar'} Morador
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingResident(null);
                  setFormData({
                    name: '',
                    unit: '',
                    email: '',
                    phone: '',
                    password: '',
                    balance: 0,
                    building: 'Condomínio Primavera',
                    address: 'Avenida 21 de Janeiro, 123, Luanda',
                    status: 'active'
                  });
                }}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de Moradores */}
        <div className="glass-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Nome</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Unidade</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-ink-muted uppercase tracking-widest">E-mail</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Telefone</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Saldo</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Status</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-ink-muted uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody>
                {residentsList.map((resident) => (
                  <tr key={resident.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">{resident.name}</p>
                        <p className="text-xs text-ink-muted">ID: {resident.id}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-brand/20 text-brand rounded-lg text-xs font-bold">
                        {resident.unit}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white text-sm">{resident.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white text-sm">{resident.phone}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className={`font-bold ${resident.balance < 0 ? 'text-red-400' : resident.balance > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        {new Intl.NumberFormat('pt-AO', {
                          style: 'currency',
                          currency: 'AOA',
                          minimumFractionDigits: 0
                        }).format(resident.balance)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        resident.status === 'active' 
                          ? 'bg-green-400/20 text-green-400' 
                          : 'bg-red-400/20 text-red-400'
                      }`}>
                        {resident.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditResident(resident)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => generateMobileCode(resident)}
                          className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600 transition-colors"
                        >
                          QR Code
                        </button>
                        <button
                          onClick={() => handleDeleteResident(resident.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {residentsList.length === 0 && (
              <div className="text-center py-12">
                <p className="text-ink-muted">Nenhum morador cadastrado ainda.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 px-6 py-2 bg-brand text-black font-bold rounded-lg text-sm uppercase tracking-widest hover:scale-[1.02] transition-all"
                >
                  Adicionar Primeiro Morador
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileManagementView;
