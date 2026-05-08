import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFConfig {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  filename: string;
  subtitle?: string;
  metadata?: {
    total?: string;
    count?: number;
    period?: string;
  };
}

export const generatePDF = ({ title, columns, rows, filename, subtitle, metadata }: PDFConfig) => {
  console.log('generatePDF called with:', { title, columns, rows, filename, subtitle, metadata });
  
  try {
    const doc = new jsPDF();

  // Add Logo / Brand
  doc.setFontSize(24);
  doc.setTextColor(212, 175, 55); // Brand Gold
  doc.text('EDI IA', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Gestão Inteligente de Edifícios', 14, 26);

  // Add Report Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 40);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    // Quebrar linha se subtitle for muito longo
    const splitSubtitle = doc.splitTextToSize(subtitle, 180);
    doc.text(splitSubtitle, 14, 48);
  }

  // Add Date and Metadata
  const dateStr = new Date().toLocaleDateString('pt-PT');
  const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${dateStr} às ${timeStr}`, 14, subtitle ? 56 : 50);

  // Add metadata if provided
  if (metadata) {
    let yPos = subtitle ? 62 : 56;
    if (metadata.total) {
      doc.text(`Total: ${metadata.total}`, 14, yPos);
      yPos += 6;
    }
    if (metadata.count) {
      doc.text(`Registos: ${metadata.count}`, 14, yPos);
      yPos += 6;
    }
    if (metadata.period) {
      doc.text(`Período: ${metadata.period}`, 14, yPos);
    }
  }

  // Calculate table start position
  let tableStartY = 70;
  if (metadata) {
    const metadataCount = [metadata.total, metadata.count, metadata.period].filter(Boolean).length;
    tableStartY += (metadataCount * 6);
  }

  // Generate Table
  autoTable(doc, {
    startY: tableStartY,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: { 
      fillColor: [212, 175, 55], 
      textColor: [0, 0, 0],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50]
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { top: tableStartY, left: 14, right: 14 },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'auto'
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Primeira coluna
      [columns.length - 1]: { cellWidth: 'auto', halign: 'right' } // Última coluna (gerally valores)
    }
  });

  // Add footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFilename = `${filename}_${timestamp}.pdf`;
  
  console.log('Attempting to save PDF with filename:', finalFilename);
  console.log('Document created successfully, pages:', (doc as any).internal.getNumberOfPages());
  
  // Try alternative save method
  try {
    doc.save(finalFilename);
    console.log('PDF save completed');
    
    // Notificação visual de sucesso mais visível
    setTimeout(() => {
      // Criar container para toast
      const toastContainer = document.createElement('div');
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      `;
      
      const toast = document.createElement('div');
      toast.style.cssText = `
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
      `;
      
      toast.innerHTML = `
        <div style="width: 24px; height: 24px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <div>
          <div style="font-size: 14px; margin-bottom: 2px;">PDF Baixado com Sucesso!</div>
          <div style="font-size: 12px; opacity: 0.9;">${finalFilename}</div>
        </div>
      `;
      
      // Adicionar animação CSS
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      
      toastContainer.appendChild(toast);
      document.body.appendChild(toastContainer);
      
      // Auto-remover após 5 segundos
      setTimeout(() => {
        toastContainer.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(toastContainer)) {
            document.body.removeChild(toastContainer);
          }
          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
        }, 300);
      }, 5000);
    }, 100);
    
  } catch (saveError) {
    console.error('Error in doc.save():', saveError);
    // Try blob method as fallback
    try {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('PDF downloaded via blob method');
    } catch (blobError) {
      console.error('Error in blob method:', blobError);
      alert('Erro ao gerar PDF. Métodos de download falharam.');
    }
  }
  
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Erro ao gerar PDF. Por favor tente novamente.');
  }
};

// Função auxiliar para gerar PDF de relatórios financeiros
export const generateFinancialPDF = (data: {
  title: string;
  transactions: any[];
  type: 'income' | 'expense' | 'all';
  period?: string;
}) => {
  console.log('generateFinancialPDF called with:', data);
  const isIncome = (type: string) => type === 'Pagamento';
  const isExpense = (type: string) => !isIncome(type);
  
  const filteredTransactions = data.type === 'all' 
    ? data.transactions 
    : data.type === 'income' 
    ? data.transactions.filter(t => isIncome(t.type))
    : data.transactions.filter(t => isExpense(t.type));

  const total = filteredTransactions.reduce((sum, t) => {
    return sum + (isIncome(t.type) ? t.amount : -t.amount);
  }, 0);

  return generatePDF({
    title: data.title,
    subtitle: data.period ? `Período: ${data.period}` : undefined,
    columns: ['Data', 'Descrição', 'Categoria', 'Valor (AOA)', 'Estado'],
    rows: filteredTransactions.map(t => [
      t.date,
      t.description,
      t.resident_name ? `Morador (${t.unit})` : t.type,
      `${isIncome(t.type) ? '+' : '-'}${new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        minimumFractionDigits: 0
      }).format(t.amount)}`,
      t.status
    ]),
    filename: data.title.toLowerCase().replace(/\s+/g, '_'),
    metadata: {
      total: new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        minimumFractionDigits: 0
      }).format(Math.abs(total)),
      count: filteredTransactions.length,
      period: data.period
    }
  });
};
