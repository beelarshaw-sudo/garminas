import sqlite3
conn = sqlite3.connect('/home/z/my-project/db/custom.db')
c = conn.cursor()

# Get demo account IDs
c.execute("SELECT id, email FROM User WHERE email LIKE '%garminas.demo'")
demo_users = c.fetchall()
print(f"Demo accounts to remove: {len(demo_users)}")
for uid, email in demo_users:
    print(f"  - {email}")

demo_ids = [uid for uid, _ in demo_users]
if not demo_ids:
    print("No demo accounts found.")
    exit()

placeholders = ",".join("?" * len(demo_ids))

# Delete in dependency order
tables = [
    ("Proposal", f"senderId IN (SELECT id FROM Profile WHERE userId IN ({placeholders})) OR receiverId IN (SELECT id FROM Profile WHERE userId IN ({placeholders}))"),
    ("Message", f"senderId IN (SELECT id FROM Profile WHERE userId IN ({placeholders}))"),
    ("Conversation", f"member1Id IN (SELECT id FROM Profile WHERE userId IN ({placeholders})) OR member2Id IN (SELECT id FROM Profile WHERE userId IN ({placeholders}))"),
    ("VerificationDocument", f"userId IN ({placeholders})"),
    ("VerificationRecord", f"profileId IN (SELECT id FROM Profile WHERE userId IN ({placeholders}))"),
    ("Preferences", f"profileId IN (SELECT id FROM Profile WHERE userId IN ({placeholders}))"),
    ("AdminRole", f"userId IN ({placeholders})"),
    ("Session", f"userId IN ({placeholders})"),
    ("UserSession", f"userId IN ({placeholders})"),
    ("Notification", f"userId IN ({placeholders})"),
    ("Block", f"blockerId IN ({placeholders}) OR blockedId IN ({placeholders})"),
    ("Payment", f"userId IN ({placeholders})"),
    ("PrivacyConsent", f"userId IN ({placeholders})"),
    ("FamilyRep", f"profileId IN (SELECT id FROM Profile WHERE userId IN ({placeholders}))"),
    ("Interest", f"senderId IN (SELECT id FROM Profile WHERE userId IN ({placeholders})) OR receiverId IN (SELECT id FROM Profile WHERE userId IN ({placeholders}))"),
    ("SavedProfile", f"saverId IN (SELECT id FROM Profile WHERE userId IN ({placeholders}))"),
    ("SupportTicket", f"userId IN ({placeholders})"),
    ("SupportTicketResponse", f"ticketId IN (SELECT id FROM SupportTicket WHERE userId IN ({placeholders}))"),
    ("Report", f"reporterId IN ({placeholders}) OR subjectId IN ({placeholders})"),
    ("AuditLog", f"userId IN ({placeholders})"),
]

for table, where in tables:
    try:
        param_count = where.count("?")
        params = demo_ids * (param_count // len(demo_ids))
        c.execute(f"DELETE FROM {table} WHERE {where}", params)
        if c.rowcount > 0:
            print(f"  Deleted {c.rowcount} from {table}")
    except Exception as e:
        print(f"  Skip {table}: {e}")

# Delete profiles
c.execute(f"DELETE FROM Profile WHERE userId IN ({placeholders})", demo_ids)
print(f"  Deleted {c.rowcount} profiles")

# Delete users
c.execute(f"DELETE FROM User WHERE id IN ({placeholders})", demo_ids)
print(f"  Deleted {c.rowcount} user accounts")

conn.commit()

# Verify remaining
print()
print("=== Remaining accounts ===")
c.execute("SELECT email, role, status, subscriptionStatus FROM User")
for r in c.fetchall():
    print(f"  {r[0]} | role={r[1]} | status={r[2]} | sub={r[3]}")
