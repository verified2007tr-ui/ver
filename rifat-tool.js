(function () {
  // ====================== লাইসেন্স সিস্টেম ======================
  const VALID_KEYS = [
    "TRADERRIFATFX",
    "RIFAT@2027",
    "NABIL@2027",
    "QX@HACK",
    "CODER@RIFAT"
  ];

  function hasValidLicense() {
    const saved = localStorage.getItem("rifat_qx_license");
    return saved && VALID_KEYS.includes(saved);
  }

  function askLicense() {
    const code = prompt("🔑 Enter Your License Key:");
    if (code && VALID_KEYS.includes(code.trim())) {
      localStorage.setItem("rifat_qx_license", code.trim());
      return true;
    }
    alert("❌ Invalid License Key!");
    return false;
  }

  if (!hasValidLicense()) {
    if (!askLicense()) return;
  }

  // আগের প্যানেল মুছে ফেলা
  const oldPanel = document.getElementById("rifat-qx-panel");
  if (oldPanel) oldPanel.remove();

  // ====================== প্যানেল তৈরি ======================
  const panel = document.createElement("div");
  panel.id = "rifat-qx-panel";
  panel.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 340px;
      max-width: 95vw;
      background: linear-gradient(145deg, #0f0f1a, #1a1a2e);
      border-radius: 18px;
      padding: 22px;
      z-index: 9999999;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 20px 60px rgba(0,0,0,0.7);
      border: 1px solid #333;
    ">
      <div style="text-align: center; margin-bottom: 18px;">
        <div style="font-size: 15px; font-weight: 600;">Rifat Custom Tool</div>
        <div style="font-size: 11px; color: #ff6b6b; margin-top: 4px;">Licensed Version</div>
      </div>

      <label style="font-size: 12px; color: #aaa;">Leaderboard Name</label>
      <input id="r-name" value="@trader_rifat" style="width:100%;padding:11px;margin:6px 0 14px;border-radius:10px;border:none;background:#252540;color:white;font-size:14px;">

      <label style="font-size: 12px; color: #aaa;">Starting Balance (Demo → Live)</label>
      <input id="r-balance" type="number" value="10000" style="width:100%;padding:11px;margin:6px 0 14px;border-radius:10px;border:none;background:#252540;color:white;font-size:14px;">

      <label style="font-size: 12px; color: #aaa;">Leaderboard Display Balance</label>
      <input id="r-lb-balance" type="number" value="526108" style="width:100%;padding:11px;margin:6px 0 18px;border-radius:10px;border:none;background:#252540;color:white;font-size:14px;">

      <button id="r-save" style="
        width: 100%;
        padding: 14px;
        background: linear-gradient(90deg, #7c3aed, #db2777);
        border: none;
        border-radius: 12px;
        color: white;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        margin-bottom: 8px;
      ">SAVE & APPLY</button>

      <button id="r-close" style="
        width: 100%;
        padding: 11px;
        background: #2a2a40;
        border: none;
        border-radius: 12px;
        color: #ccc;
        font-size: 14px;
        cursor: pointer;
      ">CLOSE</button>
    </div>
  `;
  document.body.appendChild(panel);

  // ====================== Apply Logic ======================
  document.getElementById("r-save").onclick = function () {
    const name = document.getElementById("r-name").value.trim();
    const startBalance = parseFloat(document.getElementById("r-balance").value) || 10000;
    const lbBalance = parseFloat(document.getElementById("r-lb-balance").value) || 0;

    // সেভ করা
    localStorage.setItem("rifat_start_balance", startBalance);
    localStorage.setItem("rifat_lb_name", name);
    localStorage.setItem("rifat_lb_balance", lbBalance);

    applyChanges(name, startBalance, lbBalance);
    panel.remove();
    startProfitTracker(startBalance);
  };

  document.getElementById("r-close").onclick = () => panel.remove();

  // ====================== UI চেঞ্জ ফাংশন ======================
  function applyChanges(name, balance, lbBalance) {
    // ১. উপরের DEMO → LIVE
    document.querySelectorAll("span, div, p, b").forEach(el => {
      if (el.childNodes.length === 1) {
        const txt = el.textContent.trim();
        if (txt === "DEMO" || txt === "Demo") {
          el.textContent = "LIVE";
          el.style.color = "#00e676";
          el.style.fontWeight = "bold";
        }
      }
    });

    // ২. ব্যালেন্স আপডেট (উপরের অংশ)
    const balanceSelectors = [
      '[class*="balance"]',
      '.usermenu__info-balance',
      '[class*="money"]'
    ];

    balanceSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (el.textContent.includes("$") || el.textContent.match(/\d/)) {
          el.textContent = "$" + balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      });
    });

    // ৩. অ্যাকাউন্ট ড্রপডাউনে Live দেখানোর চেষ্টা
    // (Quotex UI পরিবর্তনশীল হওয়ায় একাধিক সিলেক্টর ব্যবহার করা হয়েছে)

    // ৪. ফ্লোটিং লিডারবোর্ড তৈরি
    createLeaderboard(name, lbBalance, 0);
  }

  // ====================== লিডারবোর্ড + প্রফিট ট্র্যাকার ======================
  function createLeaderboard(name, baseBalance, currentProfit) {
    let lb = document.getElementById("rifat-leaderboard");
    if (lb) lb.remove();

    lb = document.createElement("div");
    lb.id = "rifat-leaderboard";
    lb.style.cssText = `
      position: fixed;
      top: 70px;
      right: 12px;
      background: rgba(15, 15, 25, 0.95);
      border: 1px solid #333;
      border-radius: 12px;
      padding: 12px 16px;
      z-index: 999999;
      color: white;
      font-size: 13px;
      min-width: 160px;
      backdrop-filter: blur(8px);
    `;

    const profitColor = currentProfit >= 0 ? "#00e676" : "#ff5252";
    const profitSign = currentProfit >= 0 ? "+" : "";

    lb.innerHTML = `
      <div style="font-size:11px;color:#888;margin-bottom:4px;">LEADERBOARD</div>
      <div style="font-weight:600;margin-bottom:6px;">${name}</div>
      <div style="font-size:15px;font-weight:700;">
        $${(baseBalance + currentProfit).toLocaleString()}
      </div>
      <div style="font-size:12px;color:${profitColor};margin-top:4px;">
        ${profitSign}${currentProfit.toFixed(2)}
      </div>
    `;
    document.body.appendChild(lb);
  }

  function startProfitTracker(startBalance) {
    let lastBalance = startBalance;

    // প্রতি ১.৫ সেকেন্ডে ব্যালেন্স চেক করা
    setInterval(() => {
      let currentText = "";
      const els = document.querySelectorAll('[class*="balance"], .usermenu__info-balance');
      for (let el of els) {
        if (el.textContent.includes("$")) {
          currentText = el.textContent;
          break;
        }
      }

      const match = currentText.replace(/[^0-9.]/g, "");
      const currentBal = parseFloat(match) || startBalance;
      const profit = currentBal - startBalance;

      const name = localStorage.getItem("rifat_lb_name") || "@trader";
      const lbBase = parseFloat(localStorage.getItem("rifat_lb_balance")) || 0;

      createLeaderboard(name, lbBase, profit);
    }, 1500);
  }

  // পেজ রিফ্রেশ হলে আগের সেটিংস অটো অ্যাপ্লাই
  const savedBalance = localStorage.getItem("rifat_start_balance");
  if (savedBalance) {
    setTimeout(() => {
      applyChanges(
        localStorage.getItem("rifat_lb_name") || "@trader",
        parseFloat(savedBalance),
        parseFloat(localStorage.getItem("rifat_lb_balance") || 0)
      );
      startProfitTracker(parseFloat(savedBalance));
    }, 1200);
  }

})();