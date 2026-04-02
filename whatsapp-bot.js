import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables for Supabase
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const ADMIN_PHONE = "919359646040@c.us";

console.log("Starting Saree Smart WhatsApp Bot...");

// Initialize WhatsApp Client with LocalAuth to persist login across restarts
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    console.log("\n==================================");
    console.log("WAITING FOR WHATSAPP LOGIN!");
    console.log("Please scan the QR code below using your WhatsApp Linked Devices:");
    console.log("==================================\n");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("\n✅ WhatsApp Bot is Ready and Connected!");
    console.log(`✅ Targeted Admin Number: +91 9359646040`);
    console.log(`✅ Scheduler: Configured to fire daily at 10:00 PM`);
});

// Helper to calculate daily metrics and generate PDF
async function generateDailyReport() {
    console.log("Generating EOD Report from Supabase data...");
    const todayStr = new Date().toLocaleDateString('en-US'); // Fallback string matching JS standards
    
    const { data: invoices } = await supabase.from('invoices').select('*');
    const todaysInvoices = invoices.filter(i => new Date(i.date).toLocaleDateString('en-US') === todayStr || new Date(i.date).toDateString() === new Date().toDateString());

    let totalRevenue = 0;
    let totalSales = todaysInvoices.length;
    let totalProfit = 0;

    // Fetch product map for cost basis (wholesale_price)
    const { data: products } = await supabase.from('products').select('id, wholesale_price');
    const costMap = {};
    if (products) {
        products.forEach(p => { costMap[p.id] = p.wholesale_price || 0; });
    }

    todaysInvoices.forEach(inv => {
        totalRevenue += (inv.grand_total || 0);
        
        if (inv.items_detail && Array.isArray(inv.items_detail)) {
            inv.items_detail.forEach(item => {
                const cost = costMap[item.product_id] || 0;
                // Profit = Selling Price - Cost (times quantity)
                const itemProfit = item.total - (cost * item.quantity);
                totalProfit += itemProfit;
            });
        }
    });

    const pdfPath = `./Mangalmurti_EOD_${Date.now()}.pdf`;
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            doc.pipe(fs.createWriteStream(pdfPath)).on('finish', () => resolve({ pdfPath, totalRevenue, totalSales, totalProfit }));

            // Branding Header
            doc.fontSize(24).fillColor('#D4AF37').text('Mangalmurti Sarees', { align: 'center' });
            doc.fontSize(14).fillColor('#444444').text('End of Day (EOD) Analytics Report', { align: 'center' }).moveDown();
            
            doc.fontSize(12).fillColor('black');
            doc.text(`Date Recorded: ${new Date().toDateString()}`).moveDown();
            
            // Metrics Summary
            doc.fontSize(16).text('Daily Metrics Summary', { underline: true }).moveDown(0.5);
            doc.fontSize(12).text(`Total Invoices Generated: ${totalSales}`);
            doc.text(`Total Revenue (Gross): Rs. ${totalRevenue.toLocaleString()}`);
            doc.fillColor('green').text(`Total Estimated Net Profit: Rs. ${totalProfit.toLocaleString()}`).fillColor('black').moveDown(2);
            
            // List Invoices
            doc.fontSize(16).text('Transaction Log', { underline: true }).moveDown();
            if (todaysInvoices.length === 0) {
                doc.fontSize(12).text('No transactions recorded today.');
            } else {
                todaysInvoices.forEach((inv, index) => {
                    const y = doc.y;
                    if (y > 700) doc.addPage();
                    doc.fontSize(10).text(`${index + 1}. Inv #${inv.invoice_no} | ${inv.customer_name} | Amount: ₹${inv.grand_total?.toLocaleString()}  [${inv.status.toUpperCase()}]`);
                });
            }

            doc.moveDown(3);
            doc.fontSize(10).fillColor('gray').text('Generated Automatically by Saree Smart Suite Bot', { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

// Scheduled Task -> Runs every day at 22:00 (10 PM) system time
cron.schedule('0 22 * * *', async () => {
    console.log("⏰ 10 PM Trigger: Initiating Scheduled EOD Report sending...");
    try {
        const report = await generateDailyReport();
        const media = MessageMedia.fromFilePath(report.pdfPath);
        
        const captionText = `*Mangalmurti Sarees* 🤖\n\nDaily EOD Report successfully generated for *${new Date().toDateString()}*.\n\n📊 *Summary:*\n• Total Sales: ${report.totalSales}\n• Total Revenue: ₹${report.totalRevenue.toLocaleString()}\n• Estimated Profit: ₹${report.totalProfit.toLocaleString()}\n\nPlease find the detailed PDF attached above.`;

        await client.sendMessage(ADMIN_PHONE, media, { caption: captionText });
        console.log("✅ Report successfully dispatched to Admin!");
        
        fs.unlinkSync(report.pdfPath); // Cleanup
    } catch (error) {
        console.error("❌ Error generating or sending daily report:", error);
    }
});

// Support manual triggering for debugging on server start (Optional: comment this block out later)
client.on('message_create', async msg => {
    if (msg.fromMe && msg.to === ADMIN_PHONE && msg.body === '!test-eod') {
        console.log("Manual trigger invoked. Testing report engine...");
        const report = await generateDailyReport();
        const media = MessageMedia.fromFilePath(report.pdfPath);
        await client.sendMessage(ADMIN_PHONE, media, { caption: "Manual Test Run: Output generated strictly for debugging." });
        fs.unlinkSync(report.pdfPath);
        console.log("Manual test sent.");
    }
});

client.initialize();
