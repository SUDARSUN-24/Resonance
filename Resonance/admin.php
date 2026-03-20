<?php
// ═══════════════════════════════════════════════
//  RESONANCE — Admin Panel
//  File: admin.php
//  Shows all voice requests from the database
//  Place in same folder as db.php
// ═══════════════════════════════════════════════

// ── Optional: simple password protection ────────
// Uncomment these 3 lines and set your password:
// $ADMIN_PASS = 'resonance2024';
// if (!isset($_GET['pass']) || $_GET['pass'] !== $ADMIN_PASS)
//     die('<h2>Access denied. Add ?pass=yourpassword to the URL.</h2>');

require_once __DIR__ . '/db.php';

// ── Filters ─────────────────────────────────────
$filter_voice = isset($_GET['voice']) ? trim($_GET['voice']) : '';
$filter_email = isset($_GET['email']) ? trim($_GET['email']) : '';
$search       = isset($_GET['q'])     ? trim($_GET['q'])     : '';
$page         = max(1, intval($_GET['page'] ?? 1));
$per_page     = 20;
$offset       = ($page - 1) * $per_page;

// ── Handle DELETE ────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    $del = $pdo->prepare('DELETE FROM voice_requests WHERE id = ?');
    $del->execute([intval($_POST['delete_id'])]);
    header('Location: admin.php');
    exit;
}

// ── Query ────────────────────────────────────────
$where  = [];
$params = [];

if ($filter_voice) { $where[] = 'voice_type = ?'; $params[] = $filter_voice; }
if ($filter_email) { $where[] = 'email LIKE ?';   $params[] = "%$filter_email%"; }
if ($search)       { $where[] = '(producer_name LIKE ? OR text_input LIKE ? OR email LIKE ?)'; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; }

$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Total count
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM voice_requests $whereSQL");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();
$pages = max(1, ceil($total / $per_page));

// Rows
$stmt = $pdo->prepare("SELECT * FROM voice_requests $whereSQL ORDER BY created_at DESC LIMIT $per_page OFFSET $offset");
$stmt->execute($params);
$rows = $stmt->fetchAll();

// Stats
$stats = $pdo->query("
    SELECT
        COUNT(*)                                        AS total,
        COUNT(DISTINCT email)                           AS unique_emails,
        COUNT(DISTINCT voice_type)                      AS voice_types_used,
        AVG(char_count)                                 AS avg_chars,
        voice_type,
        COUNT(*) as voice_count
    FROM voice_requests
    GROUP BY voice_type
    ORDER BY voice_count DESC
")->fetchAll();

$total_requests = $stats ? array_sum(array_column($stats, 'voice_count')) : 0;
$unique_emails  = $pdo->query("SELECT COUNT(DISTINCT email) FROM voice_requests")->fetchColumn();

// Voice breakdown for stats bar
$voice_counts = [];
foreach ($stats as $s) {
    $voice_counts[$s['voice_type']] = (int)$s['voice_count'];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RESONANCE — Admin Panel</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#020209;--card:rgba(255,255,255,.04);--brd:rgba(0,245,255,.15);--t:#e2e8f0;--mu:#64748b;--c:#00f5ff;--v:#7c3aed;--p:#ff0080;--g:#f59e0b;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Outfit',sans-serif;background:var(--bg);color:var(--t);min-height:100vh;padding:2rem;}
h1{font-family:'Orbitron',monospace;font-size:1.6rem;font-weight:900;letter-spacing:3px;background:linear-gradient(90deg,var(--c),var(--v));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.3rem;}
.sub{color:var(--mu);font-size:.85rem;margin-bottom:2rem;}
.sub a{color:var(--c);text-decoration:none;}
.sub a:hover{text-decoration:underline;}

/* Stats row */
.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:2rem;}
.stat-card{background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:1.2rem 1.5rem;text-align:center;}
.stat-num{font-family:'Orbitron',monospace;font-size:2rem;font-weight:900;color:var(--c);display:block;}
.stat-lbl{font-family:'Orbitron',monospace;font-size:.5rem;letter-spacing:2px;color:var(--mu);margin-top:4px;}

/* Voice breakdown */
.voice-breakdown{background:var(--card);border:1px solid var(--brd);border-radius:10px;padding:1.5rem;margin-bottom:2rem;}
.vb-title{font-family:'Orbitron',monospace;font-size:.7rem;letter-spacing:2px;color:var(--c);margin-bottom:1rem;}
.vb-row{display:flex;align-items:center;gap:1rem;margin-bottom:.6rem;}
.vb-label{font-family:'Orbitron',monospace;font-size:.58rem;width:110px;color:var(--t);}
.vb-track{flex:1;height:6px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;}
.vb-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--c),var(--v));transition:width .8s ease;}
.vb-count{font-family:'Orbitron',monospace;font-size:.55rem;color:var(--mu);width:30px;text-align:right;}

/* Filters */
.filters{display:flex;gap:.8rem;flex-wrap:wrap;margin-bottom:1.5rem;}
.filters input,.filters select{
    padding:.6rem 1rem;border-radius:5px;border:1px solid var(--brd);
    background:rgba(0,0,0,.3);color:var(--t);font-family:'Outfit',sans-serif;font-size:.88rem;
}
.filters input:focus,.filters select:focus{outline:none;border-color:var(--c);}
.btn-filter{padding:.6rem 1.4rem;border:none;border-radius:5px;background:linear-gradient(135deg,var(--v),var(--c));color:#fff;font-family:'Orbitron',monospace;font-size:.58rem;letter-spacing:1px;cursor:pointer;}
.btn-reset{padding:.6rem 1.4rem;border:1px solid var(--brd);border-radius:5px;background:transparent;color:var(--mu);font-family:'Orbitron',monospace;font-size:.58rem;letter-spacing:1px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;}

/* Table */
.table-wrap{overflow-x:auto;border-radius:12px;border:1px solid var(--brd);}
table{width:100%;border-collapse:collapse;font-size:.88rem;}
thead{background:rgba(0,245,255,.06);}
th{font-family:'Orbitron',monospace;font-size:.52rem;letter-spacing:2px;color:var(--c);padding:.9rem 1rem;text-align:left;border-bottom:1px solid var(--brd);white-space:nowrap;}
td{padding:.8rem 1rem;border-bottom:1px solid rgba(255,255,255,.04);color:var(--t);vertical-align:top;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:rgba(255,255,255,.02);}

/* Badges */
.badge{display:inline-block;padding:2px 8px;border-radius:3px;font-family:'Orbitron',monospace;font-size:.42rem;letter-spacing:1px;}
.badge-robotic  {background:rgba(0,245,255,.12);color:#00f5ff;}
.badge-news     {background:rgba(124,58,237,.15);color:#a78bfa;}
.badge-deep     {background:rgba(255,0,128,.12);color:#ff0080;}
.badge-calm     {background:rgba(0,229,176,.12);color:#00e5b0;}
.badge-hype     {background:rgba(245,158,11,.12);color:#f59e0b;}
.badge-mysterious{background:rgba(168,85,247,.15);color:#a855f7;}
.badge-nova     {background:rgba(244,114,182,.12);color:#f472b6;}

/* Delete button */
.btn-del{padding:3px 10px;border:1px solid rgba(255,0,128,.4);border-radius:3px;background:rgba(255,0,128,.06);color:var(--p);font-size:.75rem;cursor:pointer;transition:all .2s;}
.btn-del:hover{background:var(--p);color:#fff;}

/* Text preview */
.text-preview{max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mu);font-size:.82rem;}

/* Pagination */
.pagination{display:flex;gap:.5rem;justify-content:center;margin-top:1.5rem;flex-wrap:wrap;}
.pagination a,.pagination span{padding:.5rem .9rem;border-radius:5px;font-family:'Orbitron',monospace;font-size:.55rem;letter-spacing:1px;text-decoration:none;}
.pagination a{border:1px solid var(--brd);color:var(--mu);}
.pagination a:hover{border-color:var(--c);color:var(--c);}
.pagination .cur{background:linear-gradient(135deg,var(--v),var(--c));color:#fff;border:none;}

/* Empty state */
.empty{text-align:center;padding:3rem;color:var(--mu);}
.empty .ei{font-size:2rem;margin-bottom:.5rem;}

/* Result count */
.result-info{font-size:.82rem;color:var(--mu);margin-bottom:1rem;}
.result-info strong{color:var(--c);}
</style>
</head>
<body>

<h1>RESONANCE</h1>
<p class="sub">Admin Panel &nbsp;·&nbsp; Voice Request Database &nbsp;·&nbsp;
    <a href="pages/contact.html">← Back to Voice Lab</a>
    &nbsp;·&nbsp;
    Total records: <strong style="color:var(--c)"><?= $total_requests ?></strong>
</p>

<!-- STATS -->
<div class="stats-row">
    <div class="stat-card">
        <span class="stat-num" style="color:var(--c)"><?= $total_requests ?></span>
        <span class="stat-lbl">TOTAL REQUESTS</span>
    </div>
    <div class="stat-card">
        <span class="stat-num" style="color:var(--v)"><?= $unique_emails ?></span>
        <span class="stat-lbl">UNIQUE USERS</span>
    </div>
    <div class="stat-card">
        <span class="stat-num" style="color:var(--p)"><?= count($voice_counts) ?></span>
        <span class="stat-lbl">VOICES USED</span>
    </div>
    <div class="stat-card">
        <?php
        $avg = $pdo->query("SELECT AVG(char_count) FROM voice_requests")->fetchColumn();
        ?>
        <span class="stat-num" style="color:var(--g)"><?= $avg ? round($avg) : 0 ?></span>
        <span class="stat-lbl">AVG CHAR COUNT</span>
    </div>
</div>

<!-- VOICE BREAKDOWN -->
<?php if ($total_requests > 0): ?>
<div class="voice-breakdown">
    <div class="vb-title">VOICE TYPE BREAKDOWN</div>
    <?php
    $voice_icons = ['robotic'=>'🤖','news'=>'📺','deep'=>'🎙️','calm'=>'🧘','hype'=>'🎤','mysterious'=>'🌑','nova'=>'✨'];
    foreach ($voice_counts as $vtype => $vcount):
        $pct = $total_requests > 0 ? round($vcount / $total_requests * 100) : 0;
    ?>
    <div class="vb-row">
        <span class="vb-label"><?= ($voice_icons[$vtype] ?? '🔊') . ' ' . strtoupper($vtype) ?></span>
        <div class="vb-track"><div class="vb-fill" style="width:<?= $pct ?>%"></div></div>
        <span class="vb-count"><?= $vcount ?></span>
    </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<!-- FILTERS -->
<form method="GET" action="admin.php">
    <div class="filters">
        <input type="text" name="q" placeholder="Search name / email / text..." value="<?= htmlspecialchars($search) ?>">
        <select name="voice">
            <option value="">All Voices</option>
            <?php foreach (['robotic','news','deep','calm','hype','mysterious','nova'] as $v): ?>
            <option value="<?= $v ?>" <?= $filter_voice===$v?'selected':'' ?>><?= ucfirst($v) ?></option>
            <?php endforeach; ?>
        </select>
        <input type="text" name="email" placeholder="Filter by email..." value="<?= htmlspecialchars($filter_email) ?>">
        <button type="submit" class="btn-filter">SEARCH</button>
        <a href="admin.php" class="btn-reset">RESET</a>
    </div>
</form>

<p class="result-info">
    Showing <strong><?= count($rows) ?></strong> of <strong><?= $total ?></strong> results
    <?= $search ? " for \"<strong>$search</strong>\"" : '' ?>
</p>

<!-- TABLE -->
<?php if (empty($rows)): ?>
<div class="empty"><div class="ei">📭</div>No voice requests found.</div>
<?php else: ?>
<div class="table-wrap">
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>VOICE</th>
                <th>LANGUAGE</th>
                <th>EMOTION</th>
                <th>SPEED</th>
                <th>PITCH</th>
                <th>TEXT</th>
                <th>CHARS</th>
                <th>DATE</th>
                <th>ACTION</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($rows as $row): ?>
            <tr>
                <td style="color:var(--mu);font-family:'Orbitron',monospace;font-size:.7rem"><?= $row['id'] ?></td>
                <td><?= htmlspecialchars($row['producer_name'] ?: '—') ?></td>
                <td style="color:var(--mu)"><?= htmlspecialchars($row['email'] ?: '—') ?></td>
                <td>
                    <span class="badge badge-<?= htmlspecialchars($row['voice_type']) ?>">
                        <?= ($voice_icons[$row['voice_type']] ?? '🔊') . ' ' . strtoupper($row['voice_type']) ?>
                    </span>
                </td>
                <td style="font-size:.78rem;color:var(--mu)"><?= htmlspecialchars($row['language']) ?></td>
                <td style="font-size:.78rem;color:var(--mu)"><?= htmlspecialchars($row['emotion']) ?></td>
                <td style="font-family:'Orbitron',monospace;font-size:.65rem;color:var(--g)"><?= $row['speed'] ?>x</td>
                <td style="font-family:'Orbitron',monospace;font-size:.65rem;color:var(--v)"><?= $row['pitch'] ?></td>
                <td>
                    <div class="text-preview" title="<?= htmlspecialchars($row['text_input']) ?>">
                        <?= htmlspecialchars($row['text_input']) ?>
                    </div>
                </td>
                <td style="font-family:'Orbitron',monospace;font-size:.65rem;color:var(--c)"><?= $row['char_count'] ?></td>
                <td style="font-size:.75rem;color:var(--mu);white-space:nowrap">
                    <?= date('M d Y', strtotime($row['created_at'])) ?><br>
                    <span style="font-size:.68rem"><?= date('H:i:s', strtotime($row['created_at'])) ?></span>
                </td>
                <td>
                    <form method="POST" onsubmit="return confirm('Delete this record?')">
                        <input type="hidden" name="delete_id" value="<?= $row['id'] ?>">
                        <button type="submit" class="btn-del">✕ DEL</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</div>

<!-- PAGINATION -->
<?php if ($pages > 1): ?>
<div class="pagination">
    <?php if ($page > 1): ?>
        <a href="?page=<?= $page-1 ?>&q=<?= urlencode($search) ?>&voice=<?= urlencode($filter_voice) ?>&email=<?= urlencode($filter_email) ?>">‹ PREV</a>
    <?php endif; ?>
    <?php for ($p = max(1,$page-2); $p <= min($pages,$page+2); $p++): ?>
        <?php if ($p === $page): ?>
            <span class="cur"><?= $p ?></span>
        <?php else: ?>
            <a href="?page=<?= $p ?>&q=<?= urlencode($search) ?>&voice=<?= urlencode($filter_voice) ?>&email=<?= urlencode($filter_email) ?>"><?= $p ?></a>
        <?php endif; ?>
    <?php endfor; ?>
    <?php if ($page < $pages): ?>
        <a href="?page=<?= $page+1 ?>&q=<?= urlencode($search) ?>&voice=<?= urlencode($filter_voice) ?>&email=<?= urlencode($filter_email) ?>">NEXT ›</a>
    <?php endif; ?>
</div>
<?php endif; ?>
<?php endif; ?>

</body>
</html>