
import os
import json
import time
from datetime import datetime, timedelta
from session_manager import SessionManager

def test_cleanup():
    storage_path = "./test_sessions"
    os.makedirs(storage_path, exist_ok=True)
    
    # 1. Create an old session file (25 hours ago)
    old_session_id = "old-session-123"
    old_file = os.path.join(storage_path, f"{old_session_id}.json")
    with open(old_file, 'w') as f:
        json.dump({"session_id": old_session_id, "start_time": (datetime.now() - timedelta(hours=25)).isoformat()}, f)
    
    # Set back the modification time
    past_time = time.time() - (26 * 3600)
    os.utime(old_file, (past_time, past_time))
    
    # 2. Create a recent session file
    recent_session_id = "recent-session-456"
    recent_file = os.path.join(storage_path, f"{recent_session_id}.json")
    with open(recent_file, 'w') as f:
        json.dump({"session_id": recent_session_id, "start_time": datetime.now().isoformat()}, f)
    
    print(f"Created test sessions in {storage_path}")
    
    # 3. Initialize SessionManager which should trigger cleanup
    print("Initializing SessionManager...")
    sm = SessionManager(storage_path=storage_path)
    
    # 4. Verify
    old_exists = os.path.exists(old_file)
    recent_exists = os.path.exists(recent_file)
    
    if not old_exists and recent_exists:
        print("SUCCESS: Old session deleted, recent session preserved.")
    else:
        print(f"FAILURE: Old exists={old_exists}, Recent exists={recent_exists}")
    
    # Cleanup test directory
    for f in os.listdir(storage_path):
        os.remove(os.path.join(storage_path, f))
    os.rmdir(storage_path)

if __name__ == "__main__":
    test_cleanup()
