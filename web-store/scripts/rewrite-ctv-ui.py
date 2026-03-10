#!/usr/bin/env python3
"""Add CTV card UI CSS styles and update JS functions in admin.html"""
import sys

filepath = 'admin.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# ─── 1. Add CSS after promo-content.active rule ───
css_anchor = '.promo-content.active {\n      display: block;\n      animation: fadeSlideIn .25s ease;\n    }'

new_css = css_anchor + """

    /* ═══ CTV Card UI ═══ */
    .ctv-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .ctv-stat-card {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: transform .15s, box-shadow .15s;
    }
    .ctv-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
    .ctv-stat-icon { font-size: 28px; }
    .ctv-stat-info { display: flex; flex-direction: column; }
    .ctv-stat-value { font-size: 22px; font-weight: 700; color: var(--text); }
    .ctv-stat-label { font-size: 12px; color: var(--text2); margin-top: 2px; }

    .ctv-create-card {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    .ctv-create-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: background .15s;
    }
    .ctv-create-header:hover { background: var(--surface2); }
    .ctv-create-title { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 15px; }
    .ctv-chevron { font-size: 12px; color: var(--text2); transition: transform .2s; }
    .ctv-chevron.open { transform: rotate(180deg); }
    .ctv-create-body {
      padding: 0 20px 20px;
      border-top: 1px solid var(--border-light);
    }
    .ctv-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-top: 16px;
    }
    .ctv-form-group { display: flex; flex-direction: column; gap: 6px; }
    .ctv-label { font-size: 13px; font-weight: 600; color: var(--text2); }
    .ctv-input-wrap {
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      background: var(--surface);
    }
    .ctv-input-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .ctv-input-prefix {
      padding: 10px 12px;
      background: var(--surface2);
      font-weight: 700;
      font-size: 14px;
      color: var(--accent);
      border-right: 1px solid var(--border);
      user-select: none;
    }
    .ctv-text-input {
      flex: 1;
      border: none;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      background: transparent;
      outline: none;
    }
    .ctv-hint { font-size: 11px; color: var(--text3, #aaa); }

    .ctv-tier-selector { display: flex; gap: 10px; }
    .ctv-tier-option {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 10px;
      border: 2px solid var(--border-light);
      border-radius: 12px;
      cursor: pointer;
      transition: all .15s;
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      color: var(--text2);
    }
    .ctv-tier-option input[type="radio"] { display: none; }
    .ctv-tier-option:hover { border-color: var(--border); }
    .ctv-tier-option.selected { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }
    .ctv-tier-badge {
      font-size: 18px;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 8px;
    }
    .ctv-tier-badge.standard { background: #dbeafe; color: #2563eb; }
    .ctv-tier-badge.premium { background: #fef3c7; color: #d97706; }

    .ctv-form-actions { margin-top: 16px; }
    .ctv-submit-btn {
      padding: 12px 28px;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: transform .1s, box-shadow .15s;
    }
    .ctv-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,.3); }
    .ctv-submit-btn:active { transform: scale(.98); }

    .ctv-info-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 10px;
      font-size: 13px;
      color: #92400e;
      margin-bottom: 20px;
    }

    .ctv-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .ctv-card {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: transform .15s, box-shadow .15s;
      position: relative;
    }
    .ctv-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.06); }
    .ctv-card.inactive { opacity: .55; }
    .ctv-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .ctv-card-code {
      font-size: 18px;
      font-weight: 800;
      font-family: 'SF Mono', 'Fira Code', monospace;
      letter-spacing: 1px;
    }
    .ctv-card-tier {
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
    }
    .ctv-card-tier.t15 { background: #dbeafe; color: #2563eb; }
    .ctv-card-tier.t20 { background: #fef3c7; color: #d97706; }
    .ctv-card-owner {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ctv-card-owner-name { font-weight: 600; font-size: 15px; }
    .ctv-card-owner-contact { font-size: 12px; color: var(--text2); }
    .ctv-card-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 10px 0;
      border-top: 1px solid var(--border-light);
    }
    .ctv-card-stat {
      display: flex;
      flex-direction: column;
    }
    .ctv-card-stat-value { font-weight: 700; font-size: 15px; }
    .ctv-card-stat-label { font-size: 11px; color: var(--text2); }
    .ctv-card-actions {
      display: flex;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border-light);
    }
    .ctv-card-actions button {
      flex: 1;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all .15s;
    }
    .ctv-card-actions button:hover { background: var(--surface2); }
    .ctv-card-actions .btn-danger { color: #ef4444; border-color: #fecaca; }
    .ctv-card-actions .btn-danger:hover { background: #fef2f2; }
    .ctv-card-actions .btn-warn { color: #d97706; border-color: #fde68a; }
    .ctv-card-actions .btn-warn:hover { background: #fffbeb; }
    .ctv-card-status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 4px;
    }
    .ctv-card-status-dot.active { background: #10b981; }
    .ctv-card-status-dot.inactive { background: #9ca3af; }
    .ctv-loading { text-align: center; padding: 40px; color: var(--text2); font-size: 14px; }

    @media (max-width: 768px) {
      .ctv-stats-row { grid-template-columns: 1fr; }
      .ctv-form-grid { grid-template-columns: 1fr; }
      .ctv-cards-grid { grid-template-columns: 1fr; }
    }"""

if css_anchor in content:
    content = content.replace(css_anchor, new_css)
    print('OK: Added CTV CSS')
else:
    print('WARN: CSS anchor not found')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done.')
