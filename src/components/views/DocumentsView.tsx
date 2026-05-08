import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Folder,
  Trash2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DocumentsViewProps {
  generatePDF: (options: any) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ generatePDF }) => {
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [formData, setFormData] = React.useState({
    title: '',
    type: 'contract',
    category: 'legal',
    description: ''
  });
  const [isUploading, setIsUploading] = React.useState(false);

  const categories = [
    { id: 'all', name: 'Todos', icon: '📁' },
    { id: 'legal', name: 'Documentos Legais', icon: '⚖️' },
    { id: 'financial', name: 'Financeiros', icon: '💰' },
    { id: 'maintenance', name: 'Manutenção', icon: '🔧' },
    { id: 'administrative', name: 'Administrativos', icon: '📋' },
    { id: 'communication', name: 'Comunicações', icon: '📢' }
  ];

  const documentTypes = [
    { id: 'contract', name: 'Contrato', icon: '📄' },
    { id: 'invoice', name: 'Fatura', icon: '🧾' },
    { id: 'report', name: 'Relatório', icon: '📊' },
    { id: 'certificate', name: 'Certificado', icon: '🏆' },
    { id: 'manual', name: 'Manual', icon: '📖' },
    { id: 'other', name: 'Outro', icon: '📝' }
  ];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        // Add to local state
        const newDocument = {
          id: data.documentId,
          title: formData.title,
          type: formData.type,
          category: formData.category,
          description: formData.description,
          uploaded_at: new Date().toISOString(),
          uploaded_by: 'admin',
          file_size: '2.3 MB'
        };
        setDocuments([newDocument, ...documents]);
        
        // Reset form
        setFormData({
          title: '',
          type: 'contract',
          category: 'legal',
          description: ''
        });
        setIsUploadModalOpen(false);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (document: any) => {
    // Simulate download - in real implementation would download actual file
    console.log('Downloading document:', document.title);
    alert(`Download iniciado: ${document.title}`);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : '📁';
  };

  const getTypeIcon = (typeId: string) => {
    const type = documentTypes.find(t => t.id === typeId);
    return type ? type.icon : '📄';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-white">Gestão de Documentos</h3>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2 bg-brand text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
        >
          <Upload size={16} /> Upload Documento
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-muted" size={20} />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-ink-muted/50 focus:outline-none focus:border-brand/50"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  selectedCategory === category.id ? "bg-brand/10 text-brand border border-brand/30" : "text-ink-muted hover:text-white border border-white/10"
                )}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText size={48} className="mx-auto text-brand/20 mb-4" />
            <p className="text-ink-muted">Nenhum documento encontrado</p>
            <p className="text-sm text-ink-muted/60 mt-2">Faça upload de documentos para começar</p>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 hover:border-brand/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getTypeIcon(document.type)}</div>
                  <div>
                    <h4 className="text-white font-semibold group-hover:text-brand transition-colors line-clamp-1">
                      {document.title}
                    </h4>
                    <p className="text-xs text-ink-muted">{getCategoryIcon(document.category)} {document.category}</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} className="text-red-400 hover:text-red-300" />
                </button>
              </div>
              
              {document.description && (
                <p className="text-sm text-ink-muted mb-4 line-clamp-2">{document.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <div className="flex items-center gap-4">
                  <span>{document.file_size || '1.2 MB'}</span>
                  <span>{formatDate(document.uploaded_at)}</span>
                </div>
                <button
                  onClick={() => handleDownload(document)}
                  className="flex items-center gap-1 hover:text-brand transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 w-full max-w-lg mx-4"
          >
            <h4 className="text-xl font-bold text-white mb-6">Upload de Documento</h4>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Título do Documento</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Contrato de Prestação de Serviços"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-ink-muted/50 focus:outline-none focus:border-brand/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                    required
                  >
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id} className="bg-surface-dark">
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50"
                    required
                  >
                    {categories.filter(c => c.id !== 'all').map((category) => (
                      <option key={category.id} value={category.id} className="bg-surface-dark">
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrição opcional do documento..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-ink-muted/50 focus:outline-none focus:border-brand/50 resize-none h-24"
                />
              </div>

              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
                <Upload size={32} className="mx-auto text-ink-muted mb-4" />
                <p className="text-white font-semibold mb-2">Arraste o arquivo aqui</p>
                <p className="text-xs text-ink-muted">ou clique para selecionar</p>
                <p className="text-xs text-ink-muted/60 mt-2">PDF, DOC, DOCX (máx. 10MB)</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)} 
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-widest text-ink-muted hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="flex-1 py-3 bg-brand text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Fazendo Upload...
                    </>
                  ) : (
                    'Fazer Upload'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default DocumentsView;
