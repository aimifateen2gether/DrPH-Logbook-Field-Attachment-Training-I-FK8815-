const SERVICE_AREAS = [
  "Communicable Diseases Prevention",
  "Non-Communicable Disease Prevention",
  "Maternal and Child Health Care Services",
  "Primary Health Care Services",
  "Health Management",
  "Policy Development and Implementation",
  "Occupational Health",
  "Environmental Health, Food Safety & Quality Services"
];

const DOMAIN_NAMES = {
  "1": "Domain 1 – Applied Clinical Practice in Public Health",
  "2": "Domain 2 – Monitoring and Assessing Population's Health",
  "3": "Domain 3 – Public Health Consultation",
  "4": "Domain 4 – Investigating and Mitigating Immediate Risk to Human Health",
  "5": "Domain 5 – Policy, Planning and Program Development",
  "6": "Domain 6 – Communication, Collaboration and Advocacy for Public Health",
  "7": "Domain 7 – Professional Practice"
};

const activityTargetPerArea = 5;
const discussionTargetPerArea = 4;

function clean(v) { return (v ?? "").toString().trim(); }
function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
function keyForActivity(r) {
  return [clean(r.Date), clean(r.ServiceArea), clean(r.Activity)].join("|").toLowerCase();
}

Papa.parse("logbook.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    const rows = results.data.map(r => ({
      ...r,
      Date: clean(r.Date),
      ServiceArea: clean(r.ServiceArea),
      Activity: clean(r.Activity),
      Indicator: clean(r.Indicator),
      Evidence: clean(r.Evidence),
      Domain: clean(r.Domain),
      Competency: clean(r.Competency),
      Level: clean(r.Level).toUpperCase(),
      Role: clean(r.Role),
      DiscussionHours: num(r.DiscussionHours),
      Reflection: clean(r.Reflection),
      Status: clean(r.Status) || "Planned"
    }));
    buildDashboard(rows);
  },
  error: function(err) {
    document.body.innerHTML = "<p style='padding:30px'>Could not load logbook.csv. Make sure the file is in the same folder as index.html.</p>";
    console.error(err);
  }
});

function buildDashboard(rows) {
  const completedRows = rows.filter(r => r.Status.toLowerCase() === "completed");
  const allActivities = uniq(rows.map(keyForActivity));
  const completedActivities = uniq(completedRows.map(keyForActivity));

  const areaStats = SERVICE_AREAS.map(area => {
    const areaRows = rows.filter(r => r.ServiceArea === area);
    const completedUnique = uniq(
      areaRows.filter(r => r.Status.toLowerCase() === "completed").map(keyForActivity)
    );
    const discussion = sumUniqueDiscussion(areaRows);
    const reflectionDone = uniq(
      areaRows.filter(r => r.Reflection.toLowerCase() === "yes").map(keyForActivity)
    ).length;
    return {
      area,
      activityCount: completedUnique.length,
      discussion,
      reflectionDone,
      activityTotal: uniq(areaRows.map(keyForActivity)).length
    };
  });

  const coveredAreas = areaStats.filter(a => a.activityCount > 0).length;
  const totalHours = areaStats.reduce((s,a) => s + a.discussion, 0);

  const competencies = uniq(completedRows.map(r => `${r.Domain}|${r.Competency}`));
  document.getElementById("kpiAreas").textContent = `${coveredAreas} / 8`;
  document.getElementById("kpiActivities").textContent = `${completedActivities.length} / 40`;
  document.getElementById("kpiHours").textContent = `${totalHours.toFixed(1)} / 32`;
  document.getElementById("kpiCompetencies").textContent = competencies.length;

  const dates = rows.map(r => r.Date).filter(Boolean).sort();
  document.getElementById("lastUpdated").textContent = dates.length ? dates[dates.length - 1] : "—";

  renderAreaTable(areaStats);
  renderAreaChart(areaStats);
  renderDomainTable(completedRows);
  renderLevelChart(completedRows);
  renderGaps(areaStats);
  renderDiscussionProgress(areaStats);
  renderReflectionProgress(areaStats);
  setupFilters(rows);
}

function sumUniqueDiscussion(rows) {
  const activityMap = {};
  rows.forEach(r => {
    const k = keyForActivity(r);
    activityMap[k] = Math.max(activityMap[k] || 0, r.DiscussionHours || 0);
  });
  return Object.values(activityMap).reduce((a,b) => a+b, 0);
}

function statusFor(a) {
  const actPct = a.activityCount / activityTargetPerArea;
  const hrPct = a.discussion / discussionTargetPerArea;
  if (a.activityCount >= 5 && a.discussion >= 4) return ["Completed", "good"];
  if (a.activityCount === 0 && a.discussion === 0) return ["Not started", "bad"];
  if (actPct < .4 || hrPct < .4) return ["Priority", "bad"];
  return ["In progress", "warn"];
}

function renderAreaTable(stats) {
  const body = document.querySelector("#areaTable tbody");
  body.innerHTML = "";
  stats.forEach(a => {
    const [label, cls] = statusFor(a);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${a.area}</strong></td>
      <td>${a.activityCount} / 5</td>
      <td>${a.discussion.toFixed(1)} / 4 h</td>
      <td><span class="badge ${cls}">${label}</span></td>`;
    body.appendChild(tr);
  });
}

function renderAreaChart(stats) {
  const ctx = document.getElementById("areaChart");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: stats.map(a => a.area.replace(" Services","")),
      datasets: [{
        label: "Completed activities",
        data: stats.map(a => a.activityCount)
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      scales: { x: { beginAtZero: true, max: 5, ticks: { stepSize: 1 } } },
      plugins: { legend: { display: false } }
    }
  });
}

function renderDomainTable(rows) {
  const body = document.querySelector("#domainTable tbody");
  body.innerHTML = "";
  Object.keys(DOMAIN_NAMES).forEach(d => {
    const count = uniq(
      rows.filter(r => r.Domain === d).map(r => r.Competency)
    ).length;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${DOMAIN_NAMES[d]}</td><td><strong>${count}</strong></td>`;
    body.appendChild(tr);
  });
}

function renderLevelChart(rows) {
  const levels = ["L1","L2","L3"];
  const counts = levels.map(level =>
    uniq(rows.filter(r => r.Level === level).map(r => `${keyForActivity(r)}|${r.Domain}|${r.Competency}`)).length
  );
  const ctx = document.getElementById("levelChart");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: levels,
      datasets: [{ data: counts }]
    },
    options: { responsive: true }
  });
}

function renderGaps(stats) {
  const box = document.getElementById("gapBox");
  box.innerHTML = "";
  const ordered = [...stats].sort((a,b) => {
    const sa = (a.activityCount/5 + a.discussion/4);
    const sb = (b.activityCount/5 + b.discussion/4);
    return sa - sb;
  });
  ordered.slice(0,3).forEach(a => {
    const div = document.createElement("div");
    div.className = "gap-card";
    div.innerHTML = `
      <h3>${a.area}</h3>
      <p><strong>Activities:</strong> ${a.activityCount}/5</p>
      <p><strong>Discussion:</strong> ${a.discussion.toFixed(1)}/4 h</p>
      <p><strong>Attention:</strong> ${a.activityCount === 0 ? "Seek suitable exposure and document mapped competencies." : "Prioritise remaining activities, discussion hours and evidence."}</p>`;
    box.appendChild(div);
  });
}

function renderDiscussionProgress(stats) {
  const box = document.getElementById("discussionProgress");
  box.innerHTML = "";
  stats.forEach(a => {
    const pct = Math.min(100, (a.discussion/4)*100);
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `
      <div class="meta"><span>${a.area}</span><strong>${a.discussion.toFixed(1)} / 4 h</strong></div>
      <div class="progress"><span style="width:${pct}%"></span></div>`;
    box.appendChild(row);
  });
}

function renderReflectionProgress(stats) {
  const box = document.getElementById("reflectionProgress");
  box.innerHTML = "";
  stats.forEach(a => {
    const pct = a.activityTotal ? Math.min(100, a.reflectionDone / a.activityTotal * 100) : 0;
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `
      <div class="meta"><span>${a.area}</span><strong>${a.reflectionDone} activity reflection(s)</strong></div>
      <div class="progress"><span style="width:${pct}%"></span></div>`;
    box.appendChild(row);
  });
}

function setupFilters(rows) {
  const areaSel = document.getElementById("filterArea");
  SERVICE_AREAS.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a; opt.textContent = a; areaSel.appendChild(opt);
  });
  const statusSel = document.getElementById("filterStatus");
  const search = document.getElementById("searchBox");

  function render() {
    const area = areaSel.value;
    const status = statusSel.value;
    const q = search.value.toLowerCase();
    const filtered = rows.filter(r => {
      const hay = `${r.Activity} ${r.Competency} ${r.Evidence} ${r.Role}`.toLowerCase();
      return (!area || r.ServiceArea === area) &&
             (!status || r.Status === status) &&
             (!q || hay.includes(q));
    });
    const body = document.querySelector("#activityTable tbody");
    body.innerHTML = "";
    filtered.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.Date}</td>
        <td>${r.ServiceArea}</td>
        <td><strong>${r.Activity}</strong>${r.Role ? `<br><span class="footnote">${r.Role}</span>` : ""}</td>
        <td>${r.Domain ? `D${r.Domain}` : ""}${r.Competency ? ` – ${r.Competency}` : ""}</td>
        <td>${r.Level}</td>
        <td>${r.DiscussionHours || ""}</td>
        <td>${r.Evidence}</td>
        <td>${r.Reflection}</td>
        <td><span class="badge">${r.Status}</span></td>`;
      body.appendChild(tr);
    });
  }
  [areaSel,statusSel,search].forEach(el => el.addEventListener("input", render));
  render();
}
