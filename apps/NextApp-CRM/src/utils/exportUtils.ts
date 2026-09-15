import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { OrderMaster, OrderItem, OrderStatus, timestampToDate, formatCurrency } from '../types';

interface ReportData {
  orders: OrderMaster[];
  orderItems: OrderItem[];
  filters: any;
  stats: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    statusCounts: Record<OrderStatus, number>;
  };
  generatedAt: string;
}

export const exportToExcel = async (data: ReportData, filename: string) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Order Report Summary'],
    ['Generated At', format(new Date(data.generatedAt), 'PPpp')],
    ['Date Range', `${data.filters.startDate} to ${data.filters.endDate}`],
    ['Status Filter', data.filters.status === 'all' ? 'All Status' : data.filters.status],
    [],
    ['Statistics'],
    ['Total Orders', data.stats.totalOrders],
    ['Total Revenue', formatCurrency(data.stats.totalRevenue)],
    ['Average Order Value', formatCurrency(data.stats.avgOrderValue)],
    [],
    ['Status Breakdown'],
    ...Object.entries(data.stats.statusCounts).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count
    ])
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Orders Sheet
  const ordersData = [
    ['Order ID', 'CRM Order ID', 'PO Number', 'Status', 'Urgency', 'Branch', 'Retailer ID', 'Place Date', 'Place By', 'Total Amount', 'Remarks']
  ];

  data.orders.forEach(order => {
    const orderItems = data.orderItems.filter(item => item.Order_Id === order.Order_Id);
    const orderTotal = orderItems.reduce((sum, item) => sum + (item.ItemAmount || 0), 0);

    ordersData.push([
      order.Order_Id.toString(),
      order.CRMOrderId || '',
      order.PO_Number || '',
      order.Order_Status || '',
      order.Urgent_Status || '',
      order.Branch || '',
      order.Retailer_Id?.toString() || '',
      order.Place_Date ? format(timestampToDate(order.Place_Date)!, 'yyyy-MM-dd HH:mm') : '',
      order.Place_By || '',
      formatCurrency(orderTotal),
      order.Remark || ''
    ]);
  });

  const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
  
  // Auto-size columns
  const colWidths = [
    { wch: 10 }, // Order ID
    { wch: 15 }, // CRM Order ID
    { wch: 15 }, // PO Number
    { wch: 12 }, // Status
    { wch: 10 }, // Urgency
    { wch: 10 }, // Branch
    { wch: 12 }, // Retailer ID
    { wch: 20 }, // Place Date
    { wch: 15 }, // Place By
    { wch: 12 }, // Total Amount
    { wch: 30 }  // Remarks
  ];
  ordersSheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');

  // Order Items Detail Sheet
  const itemsData = [
    ['Order ID', 'Item ID', 'Part Admin', 'Part Salesman', 'Order Qty', 'Dispatch Qty', 'MRP', 'Item Amount', 'Status', 'Discounts']
  ];

  data.orderItems.forEach(item => {
    const totalDiscount = (item.Discount || 0) + (item.SchemeDisc || 0) + (item.AdditionalDisc || 0);
    
    itemsData.push([
      item.Order_Id?.toString() || '',
      item.Order_Item_Id.toString(),
      item.Part_Admin || '',
      item.Part_Salesman || '',
      item.Order_Qty?.toString() || '0',
      item.Dispatch_Qty?.toString() || '0',
      formatCurrency(item.MRP),
      formatCurrency(item.ItemAmount),
      item.OrderItemStatus || '',
      `${totalDiscount}%`
    ]);
  });

  const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
  itemsSheet['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Order Items');

  // Write file
  XLSX.writeFile(workbook, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportToPDF = async (data: ReportData, filename: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102); // #003366
  doc.text('NextApp Inc. - Order Report', 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Generated: ${format(new Date(data.generatedAt), 'PPpp')}`, 20, 30);
  doc.text(`Date Range: ${data.filters.startDate} to ${data.filters.endDate}`, 20, 37);
  doc.text(`Status Filter: ${data.filters.status === 'all' ? 'All Status' : data.filters.status}`, 20, 44);

  // Summary Statistics
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text('Summary Statistics', 20, 60);
  
  const summaryTableData = [
    ['Metric', 'Value'],
    ['Total Orders', data.stats.totalOrders.toString()],
    ['Total Revenue', formatCurrency(data.stats.totalRevenue)],
    ['Average Order Value', formatCurrency(data.stats.avgOrderValue)]
  ];

  autoTable(doc, {
    head: [summaryTableData[0]],
    body: summaryTableData.slice(1),
    startY: 65,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102] },
    margin: { left: 20, right: 20 }
  });

  // Status Breakdown
  const statusTableData = [
    ['Status', 'Count'],
    ...Object.entries(data.stats.statusCounts).map(([status, count]) => [
      status.charAt(0).toUpperCase() + status.slice(1),
      count.toString()
    ])
  ];

  autoTable(doc, {
    head: [statusTableData[0]],
    body: statusTableData.slice(1),
    startY: (doc as any).lastAutoTable.finalY + 10,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102] },
    margin: { left: 20, right: 20 }
  });

  // Orders Table
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text('Order Details', 20, 20);

  const ordersTableData = data.orders.map(order => {
    const orderItems = data.orderItems.filter(item => item.Order_Id === order.Order_Id);
    const orderTotal = orderItems.reduce((sum, item) => sum + (item.ItemAmount || 0), 0);
    
    return [
      order.Order_Id.toString(),
      order.Place_Date ? format(timestampToDate(order.Place_Date)!, 'MM/dd/yyyy') : '',
      order.Order_Status || '',
      orderItems.length.toString(),
      formatCurrency(orderTotal)
    ];
  });

  autoTable(doc, {
    head: [['Order ID', 'Date', 'Status', 'Items', 'Total']],
    body: ordersTableData,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 10 }
  });

  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportToWord = async (data: ReportData, filename: string) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: "NextApp Inc. - Order Report",
              bold: true,
              size: 32,
              color: "003366"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Report Info
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${format(new Date(data.generatedAt), 'PPpp')}`,
              size: 24
            })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Date Range: ${data.filters.startDate} to ${data.filters.endDate}`,
              size: 24
            })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Status Filter: ${data.filters.status === 'all' ? 'All Status' : data.filters.status}`,
              size: 24
            })
          ],
          spacing: { after: 400 }
        }),

        // Summary Statistics Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Summary Statistics",
              bold: true,
              size: 28,
              color: "003366"
            })
          ],
          spacing: { after: 200 }
        }),

        // Summary Table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Metric", bold: true })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Value", bold: true })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Total Orders" })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: data.stats.totalOrders.toString() })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Total Revenue" })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(data.stats.totalRevenue) })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Average Order Value" })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(data.stats.avgOrderValue) })] })]
                })
              ]
            })
          ]
        }),

        // Status Breakdown Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Status Breakdown",
              bold: true,
              size: 28,
              color: "003366"
            })
          ],
          spacing: { before: 400, after: 200 }
        }),

        // Status Table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Count", bold: true })] })]
                })
              ]
            }),
            ...Object.entries(data.stats.statusCounts).map(([status, count]) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: status.charAt(0).toUpperCase() + status.slice(1) })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: count.toString() })] })]
                  })
                ]
              })
            )
          ]
        }),

        // Order Details Header
        new Paragraph({
          children: [
            new TextRun({
              text: "Order Details",
              bold: true,
              size: 28,
              color: "003366"
            })
          ],
          spacing: { before: 400, after: 200 }
        }),

        // Orders Table
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Order ID", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Items", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] })
              ]
            }),
            ...data.orders.slice(0, 20).map(order => {
              const orderItems = data.orderItems.filter(item => item.Order_Id === order.Order_Id);
              const orderTotal = orderItems.reduce((sum, item) => sum + (item.ItemAmount || 0), 0);
              
              return new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: order.Order_Id.toString() })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: order.Place_Date ? format(timestampToDate(order.Place_Date)!, 'MM/dd/yyyy') : '' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: order.Order_Status || '' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: orderItems.length.toString() })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(orderTotal) })] })] })
                ]
              });
            })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.docx`);
};