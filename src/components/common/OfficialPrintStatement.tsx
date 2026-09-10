import React from 'react';
import { formatCurrency, formatDateTime12Hr } from '../../utils/formatters';
import { PrintConfig } from './PrintOptionsModal';

interface OfficialPrintStatementProps {
  config: PrintConfig | null;
  rangeData: {
    totalPurchasesCount: number;
    totalSalesCount: number;
    totalExpensesCount?: number;
    totalPurchaseAmount: number;
    totalPurchaseWeight: number;
    totalSaleAmount: number;
    totalSaleWeight: number;
    totalExpenseAmount?: number;
    netBalance: number;
    purchases: any[];
    sales: any[];
    expenses?: any[];
    itemBreakdown: Array<{
      itemId: string;
      itemName: string;
      localName: string;
      buyQty: number;
      buyAmount: number;
      sellQty: number;
      sellAmount: number;
      unit: string;
    }>;
  };
  unifiedTransactions: Array<{
    id: string;
    type: 'PURCHASE' | 'SALE';
    date: string;
    created_at?: string;
    party_name: string;
    total_amount: number;
    items: Array<{
      item_name: string;
      item_local_name?: string;
      quantity: number;
      unit: string;
      rate: number;
      amount: number;
    }>;
  }>;
}

export const OfficialPrintStatement: React.FC<OfficialPrintStatementProps> = ({
  config,
  rangeData,
  unifiedTransactions,
}) => {
  if (!config) return null;

  const printTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div id="official-print-statement" className="print-document-root">
      <div className="official-print-frame">
        {/* 1. Formal Business Letterhead */}
        <div className="text-center pb-3 border-b-2 border-black">
          <h1 className="text-2xl font-black tracking-wider uppercase m-0 font-serif">
            RASEED TRADERS
          </h1>
          <div className="text-[12px] font-bold tracking-normal uppercase text-zinc-800 mt-0.5">
            रसीद ट्रेडर्स · Scrap Merchants & Commission Agents (कबाड़ व्यापार)
          </div>
          <div className="text-[11px] text-zinc-700 mt-0.5 font-medium">
            Behind Masjid, Bus Stand, Lakhnadon, Dist. Seoni (M.P.) 480886 · Mobile: +91 744 061 9649
          </div>
        </div>

        {/* 2. Document Title & Date Range Banner */}
        <table className="w-full max-w-full my-3 border border-black bg-zinc-100 text-xs border-collapse box-border">
          <tbody>
            <tr>
              <td className="p-2 font-extrabold uppercase tracking-wide text-left align-middle border-none text-[11px]">
                HISAAB & TRADE STATEMENT (हिसाब विवरण)
              </td>
              <td className="p-2 font-semibold text-right align-middle text-[10px] text-zinc-800 border-none whitespace-nowrap">
                <div>Period: <strong>{config.startDate}</strong> to <strong>{config.endDate}</strong></div>
                <div className="text-[9px] text-zinc-600 font-normal mt-0.5">Printed: {printTimestamp}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. Executive Summary KPI Table */}
        {config.includeSummary && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-zinc-800">
              1. Executive Summary (कुल हिसाब सारांश)
            </div>
            <table className="w-full text-xs border-collapse border border-black">
              <thead>
                <tr className="bg-zinc-100 border-b border-black">
                  <th className="p-2 border-r border-black text-left font-bold">Total Khareeda (कुल खरीदी)</th>
                  <th className="p-2 border-r border-black text-left font-bold">Total Becha (कुल बिक्री)</th>
                  <th className="p-2 border-r border-black text-left font-bold">Custom Kharcha (कुल ख़र्च)</th>
                  <th className="p-2 text-left font-bold">Net Hisaab (शुद्ध अंतर)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-r border-black font-semibold">
                    <div className="text-sm font-extrabold">{formatCurrency(rangeData.totalPurchaseAmount)}</div>
                    <div className="text-[10px] text-zinc-600 font-normal">
                      {rangeData.totalPurchaseWeight.toLocaleString('en-IN')} KG · {rangeData.totalPurchasesCount} Bills
                    </div>
                  </td>
                  <td className="p-2 border-r border-black font-semibold">
                    <div className="text-sm font-extrabold">{formatCurrency(rangeData.totalSaleAmount)}</div>
                    <div className="text-[10px] text-zinc-600 font-normal">
                      {rangeData.totalSaleWeight.toLocaleString('en-IN')} KG · {rangeData.totalSalesCount} Bills
                    </div>
                  </td>
                  <td className="p-2 border-r border-black font-semibold">
                    <div className="text-sm font-extrabold text-red-700">{formatCurrency(rangeData.totalExpenseAmount || 0)}</div>
                    <div className="text-[10px] text-zinc-600 font-normal">
                      {rangeData.totalExpensesCount || 0} Entries
                    </div>
                  </td>
                  <td className="p-2 font-semibold">
                    <div className={`text-base font-black ${rangeData.netBalance >= 0 ? 'text-black' : 'text-red-700'}`}>
                      {rangeData.netBalance >= 0 ? '+' : ''}{formatCurrency(rangeData.netBalance)}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-normal">
                      {rangeData.netBalance >= 0 ? 'Surplus / Profit (शुद्ध बचत)' : 'Deficit / Purchases Exceed (कमी)'}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Custom Expenses Statement */}
        {config.includeExpenses && (rangeData.expenses || []).length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-zinc-800 flex items-center justify-between">
              <span>2. Custom Kharcha Details (दुकान व अन्य ख़र्चे)</span>
              <span>Total: {formatCurrency(rangeData.totalExpenseAmount || 0)}</span>
            </div>
            <table className="w-full text-[11px] border-collapse border border-black">
              <thead>
                <tr className="bg-zinc-100 border-b border-black">
                  <th className="p-1.5 border-r border-black w-10 text-center">#</th>
                  <th className="p-1.5 border-r border-black w-36 text-left">Date & Time</th>
                  <th className="p-1.5 border-r border-black text-left">Recipient (किसे दिया)</th>
                  <th className="p-1.5 border-r border-black text-left">Reason (खर्च का कारण)</th>
                  <th className="p-1.5 text-right w-24">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rangeData.expenses!.map((exp: any, idx: number) => (
                  <tr key={exp.id || idx} className="border-b border-zinc-300">
                    <td className="p-1.5 border-r border-black text-center">{idx + 1}</td>
                    <td className="p-1.5 border-r border-black font-mono text-[10px]">
                      {formatDateTime12Hr(exp.expense_date, exp.created_at)}
                    </td>
                    <td className="p-1.5 border-r border-black font-bold">{exp.recipient_name}</td>
                    <td className="p-1.5 border-r border-black">{exp.reason}</td>
                    <td className="p-1.5 text-right font-bold text-red-700 font-mono">
                      -{formatCurrency(exp.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-zinc-100 font-extrabold border-t border-black">
                  <td colSpan={4} className="p-1.5 border-r border-black text-right uppercase">
                    Kul Kharcha Total:
                  </td>
                  <td className="p-1.5 text-right text-red-700 font-mono">
                    -{formatCurrency(rangeData.totalExpenseAmount || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Detailed Transaction Activity Ledger */}
        {config.includeTransactions && unifiedTransactions.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-zinc-800">
              3. Kharidi & Bikri Ledger (लेन-देन समय विवरण)
            </div>
            <table className="w-full text-[11px] border-collapse border border-black">
              <thead>
                <tr className="bg-zinc-100 border-b border-black">
                  <th className="p-1.5 border-r border-black w-8 text-center">#</th>
                  <th className="p-1.5 border-r border-black w-32 text-left">Date & 12hr Time</th>
                  <th className="p-1.5 border-r border-black w-14 text-center">Type</th>
                  <th className="p-1.5 border-r border-black w-28 text-left">Party Name</th>
                  <th className="p-1.5 border-r border-black text-left">Material Details</th>
                  <th className="p-1.5 text-right w-24">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {unifiedTransactions.map((tx, idx) => {
                  const isPurchase = tx.type === 'PURCHASE';
                  return (
                    <tr key={tx.id || idx} className="border-b border-zinc-300">
                      <td className="p-1.5 border-r border-black text-center">{idx + 1}</td>
                      <td className="p-1.5 border-r border-black font-mono text-[10px]">
                        {formatDateTime12Hr(tx.date, tx.created_at)}
                      </td>
                      <td className="p-1.5 border-r border-black text-center font-bold text-[10px]">
                        {isPurchase ? 'KHARIDI' : 'BIKRI'}
                      </td>
                      <td className="p-1.5 border-r border-black font-medium truncate">
                        {tx.party_name || 'Walk-in'}
                      </td>
                      <td className="p-1.5 border-r border-black">
                        {tx.items.map((it, iIdx) => (
                          <span key={iIdx} className="mr-2 inline-block">
                            <strong>{it.item_name}</strong> {it.quantity} {it.unit} @ ₹{it.rate}
                          </span>
                        ))}
                      </td>
                      <td className="p-1.5 text-right font-bold font-mono">
                        {formatCurrency(tx.total_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Material-wise Aggregate Breakdown Table */}
        {config.includeMaterialBreakdown && (rangeData.itemBreakdown || []).length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1 text-zinc-800">
              4. Material-wise Stock & Trade Summary (सामग्री विवरण)
            </div>
            <table className="w-full text-[11px] border-collapse border border-black">
              <thead>
                <tr className="bg-zinc-100 border-b border-black">
                  <th className="p-1.5 border-r border-black text-left">Material (सामग्री)</th>
                  <th className="p-1.5 border-r border-black text-right w-24">Buy Qty</th>
                  <th className="p-1.5 border-r border-black text-right w-24">Buy Amount</th>
                  <th className="p-1.5 border-r border-black text-right w-24">Sell Qty</th>
                  <th className="p-1.5 border-r border-black text-right w-24">Sell Amount</th>
                  <th className="p-1.5 text-right w-24">Diff (अंतर ₹)</th>
                </tr>
              </thead>
              <tbody>
                {rangeData.itemBreakdown.map((row) => {
                  const diff = row.sellAmount - row.buyAmount;
                  return (
                    <tr key={row.itemId} className="border-b border-zinc-300">
                      <td className="p-1.5 border-r border-black font-bold">
                        {row.itemName} {row.localName ? `(${row.localName})` : ''}
                      </td>
                      <td className="p-1.5 border-r border-black text-right font-mono">
                        {row.buyQty > 0 ? `${row.buyQty} ${row.unit}` : '—'}
                      </td>
                      <td className="p-1.5 border-r border-black text-right font-mono">
                        {row.buyAmount > 0 ? formatCurrency(row.buyAmount) : '—'}
                      </td>
                      <td className="p-1.5 border-r border-black text-right font-mono">
                        {row.sellQty > 0 ? `${row.sellQty} ${row.unit}` : '—'}
                      </td>
                      <td className="p-1.5 border-r border-black text-right font-mono">
                        {row.sellAmount > 0 ? formatCurrency(row.sellAmount) : '—'}
                      </td>
                      <td className="p-1.5 text-right font-bold font-mono">
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. Official Declaration & Signatures */}
        {config.includeSignatures && (
          <div className="mt-6 pt-3 border-t border-black">
            <div className="text-[10px] text-zinc-600 mb-6 italic">
              * घोषणा: प्रमाणित किया जाता है कि उपरोक्त विवरण व हिसाब पूर्णतः सत्य और दुरुस्त है। (Certified that the above statement is true and correct.)
            </div>
            <div className="grid grid-cols-2 gap-8 text-xs">
              <div className="border-t border-black pt-1.5">
                <span className="font-bold">Prepared By / मुंशी (हस्ताक्षर):</span>
              </div>
              <div className="border-t border-black pt-1.5 text-right">
                <span className="font-bold">Authorized Signatory / प्रोपराइटर (हस्ताक्षर):</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
