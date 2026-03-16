#!/usr/bin/env python3
"""Add edit button to CTV cards and editCtvCode JS function"""

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add edit button to CTV card actions
old_actions = '''              '<div class="ctv-card-actions">' +
                "<button onclick=\\"openCtvUsageModal('" + escAttr(c.code) + "')\\">'''

new_actions = '''              '<div class="ctv-card-actions">' +
                "<button onclick=\\"editCtvCode('" + c.id + "','" + escAttr(c.code) + "'," + (c.discount_percent || 15) + ",'" + escAttr(c.owner_name || '') + "','" + escAttr(c.owner_contact || '') + "','" + escAttr(c.description || '') + "')\\">✏️ Sửa</button>" +
                "<button onclick=\\"openCtvUsageModal('" + escAttr(c.code) + "')\\">'''

if old_actions in content:
    content = content.replace(old_actions, new_actions)
    print('OK: Added edit button')
else:
    print('WARN: edit button anchor not found')

# 2. Add editCtvCode function before toggleCtvForm
edit_fn = '''
    // ═══ Edit CTV Code ═══
    function editCtvCode(id, code, pct, owner, contact, desc) {
      var newPct = prompt('Phần trăm giảm cho ' + code + '\\n(Nhập 15 hoặc 20):', pct);
      if (newPct === null) return;
      newPct = parseInt(newPct);
      if (newPct !== 15 && newPct !== 20) return showAdminToast('Chỉ hỗ trợ 15% hoặc 20%', 'error');

      var newOwner = prompt('Tên CTV:', owner);
      if (newOwner === null) newOwner = owner;
      var newContact = prompt('Liên hệ:', contact);
      if (newContact === null) newContact = contact;

      fetch(BASE + '/admin-discounts', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ action: 'update', id: id, discountPercent: newPct, ownerName: newOwner, ownerContact: newContact })
      }).then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.success) {
            showAdminToast('Đã cập nhật ' + code + ' → ' + newPct + '%', 'success');
            loadDiscounts();
          } else {
            showAdminToast(data.error || 'Lỗi cập nhật', 'error');
          }
        }).catch(function(e) { showAdminToast('Lỗi: ' + e.message, 'error'); });
    }

'''

anchor = '    // ═══ CTV UI Helper Functions ═══'
if anchor in content:
    content = content.replace(anchor, edit_fn + anchor)
    print('OK: Added editCtvCode function')
else:
    print('WARN: JS anchor not found')

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done.')
