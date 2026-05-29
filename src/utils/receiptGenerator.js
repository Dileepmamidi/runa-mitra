export function generateReceipt({ paymentDate, borrowerName, principal, amountPaid, method }) {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .receipt { border: 2px dashed #ccc; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .total { font-size: 24px; font-weight: bold; text-align: center; margin-top: 20px; color: #166534; }
          @media print {
            .no-print { display: none; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>Runa Mitra Receipt</h2>
            <p>Date: ${paymentDate}</p>
          </div>
          <div class="row"><span>Borrower:</span> <strong>${borrowerName}</strong></div>
          <div class="row"><span>Loan Principal:</span> <strong>₹${principal}</strong></div>
          <div class="row"><span>Method:</span> <strong>${method || 'Cash'}</strong></div>
          <div class="total">Amount Paid: ₹${amountPaid}</div>
          <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">Thank you for your payment!</p>
          
          <div style="text-align: center; margin-top: 30px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; background: #16a34a; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Now</button>
          </div>
        </div>
        <script>
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
