CREATE TABLE IF NOT EXISTS ai_voice_agents (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  language TEXT DEFAULT 'es' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  flow_nodes JSONB DEFAULT '[]'::jsonb NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  calls_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_voice_calls (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id VARCHAR(36) NOT NULL REFERENCES ai_voice_agents(id) ON DELETE CASCADE,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  call_sid TEXT,
  duration INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  transcript TEXT,
  recording_url TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_voice_agents_user_id ON ai_voice_agents(user_id);
CREATE INDEX idx_ai_voice_calls_agent_id ON ai_voice_calls(agent_id);
CREATE INDEX idx_ai_voice_calls_user_id ON ai_voice_calls(user_id);
CREATE INDEX idx_ai_voice_calls_created_at ON ai_voice_calls(created_at DESC);
