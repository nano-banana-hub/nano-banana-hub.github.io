# BananaHub Agent Initialization

Stable URL: https://bananahub.ai/agent-init.md
Machine-readable companion: https://bananahub.ai/agent-init.json

Use this file when a user asks an agent to make BananaHub usable from a fresh environment. It covers installation, local API-key setup, diagnosis, and validation. After initialization, use https://bananahub.ai/llms.txt and https://bananahub.ai/catalog.json for template discovery.

## How to Hand This to Another Agent

```text
Read https://bananahub.ai/agent-init.json and initialize BananaHub according to it.
```

The safety rules, provider choices, dependency behavior, and validation steps are part of the initialization contract itself.

## Scope Boundary

This initialization contract does:

- install BananaHub Skill when the host agent supports the listed install command
- diagnose local BananaHub provider configuration
- create or update BananaHub provider profiles in the local BananaHub config
- collect or route API-key entry according to user choice, then persist it in the local BananaHub config
- install missing Python runtime packages reported by `config doctor --json` after user consent
- validate provider-backed, host-native, or prompt-only runtime mode

This initialization contract does not:

- run SQL or database migrations
- modify application database schemas
- upgrade Cloudflare Worker, KV, API, CLI, template repositories, or other BananaHub components
- update an existing BananaHub installation beyond what the selected host install command normally does
- run paid image generation without explicit user consent

If BananaHub Skill is already installed, diagnose first and preserve any valid provider/profile/model configuration. Treat SQL/database changes, service upgrades, CLI upgrades, template repository updates, and platform deployment changes as separate maintenance tasks outside this initialization contract.

## Agent Contract

- Do not assume the agent can run interactive TTY prompts.
- Ask whether the user wants to provide credentials directly to the agent or run a placeholder command locally.
- If the user chooses direct entry or already pasted values, persist them immediately with `config quickset --api-key-stdin` and do not echo secrets back.
- If the user does not want secrets in chat, provide a `config quickset` command with placeholders for their local terminal.
- Treat `init --wizard` as a human-terminal fallback, not the default agent path.
- Ask only one setup question unless diagnosis proves more is needed: "Which image channel do you already have?"
- Default to `openai-compatible` with `gpt-image-2` when the user has an OpenAI-style image gateway and no stronger preference.
- Preserve any provider/profile/model that already validates.
- Do not run paid image generation tests unless the user explicitly agrees.
- Use machine-readable diagnosis before explaining setup state to the user.

## Install BananaHub Skill

Choose the install path supported by the host agent:

```bash
npx skills add https://github.com/bananahub-ai/bananahub-skill --skill bananahub
```

```bash
claude skill install https://github.com/bananahub-ai/bananahub-skill
```

Then run the user-facing command when the host supports skills:

```text
/bananahub init
```

If working directly in a cloned skill repository, run the Python script from that repository root:

```bash
python3 scripts/bananahub.py config doctor --json
```

If the host exposes a skill base directory, use that absolute path:

```bash
python3 {baseDir}/scripts/bananahub.py config doctor --json
```

## Zero-to-Ready Flow

1. Diagnose first:

```bash
python3 {baseDir}/scripts/bananahub.py config doctor --json
```

2. If `status` is `ok`, stop setup and proceed to BananaHub work.
3. If `status` is `needs_setup`, inspect `missing_fields`, `missing_dependencies`, `requires_user_secret`, `suggested_commands`, and `agent_notes`.
4. If connection fields are missing, ask only for the provider-required values. Direct API-key entry is allowed when the user chooses it; write API keys with `--api-key-stdin`. Otherwise provide the matching `config quickset` command with placeholders.
5. Persist the provider profile with `config quickset`. This writes to `~/.config/bananahub/config.json`.
6. If the user wants manual interactive setup instead, ask them to run the human-terminal fallback:

```bash
python3 {baseDir}/scripts/bananahub.py init --wizard
```

7. If dependencies are missing and the user allows local package installation, use `dependency_install_command` from `config doctor --json`, or:

```bash
python3 {baseDir}/scripts/bananahub.py init --skip-test --install-deps
```

8. Validate without paid image generation:

```bash
python3 {baseDir}/scripts/bananahub.py init --skip-test --json
python3 {baseDir}/scripts/bananahub.py config show
```

If `init --skip-test --json` returns `status: "incomplete"` only because `missing_dependencies` is non-empty, the API-key setup can still be saved correctly. Install the packages from `dependency_install_command` or rerun:

```bash
python3 {baseDir}/scripts/bananahub.py init --skip-test --install-deps
```

If package installation fails with a PEP 668 `externally-managed-environment` error, do not add `--break-system-packages` automatically. Ask the user whether to use their agent's Python environment, a virtual environment, or the operating-system package manager, then rerun `config doctor --json`.

9. Only after explicit consent, run a provider healthcheck or image-generation smoke test.

## Profile Config Contract

BananaHub persists image API connection details in `~/.config/bananahub/config.json`. Prefer named profiles so users can switch API keys, endpoints, and models later without rewriting the whole config.

```json
{
  "default_profile": "gpt",
  "profiles": {
    "gpt": {
      "provider": "openai-compatible",
      "openai_base_url": "https://example.com/v1",
      "openai_api_key": "<persisted secret>",
      "model": "gpt-image-2"
    },
    "nano": {
      "provider": "google-ai-studio",
      "api_key": "<persisted secret>",
      "model": "gemini-3-pro-image-preview"
    }
  }
}
```

Default profile names:

- `gpt`: `openai-compatible` or `openai`
- `nano`: `google-ai-studio` or `gemini-compatible`
- `vertex`: `vertex-ai`
- `chat`: `chatgpt-compatible`

## Provider Choices

Ask the user which image channel they already have:

- OpenAI-compatible gateway: Cherry Studio, Bigfish, or another OpenAI-style Images API gateway. Recommended default profile: `gpt`; model: `gpt-image-2`.
- OpenAI official: official GPT Image API. Recommended profile: `gpt`; model: `gpt-image-2`.
- Google AI Studio: Gemini / Nano Banana route. Recommended profile: `nano`; model: `gemini-3-pro-image-preview`.
- Gemini-compatible gateway: Gemini-style relay/proxy. Recommended profile: `nano`.
- Vertex AI: enterprise GCP route. Recommended profile: `vertex`; usually `auth_mode=adc`.
- ChatGPT-compatible endpoint: chat/completions endpoint that returns image URLs or base64 in assistant messages. Recommended profile: `chat`.

## Local Quickset Commands

OpenAI-compatible gateway:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider openai-compatible --profile gpt --default-profile \
  --base-url "<openai-compatible base url>" --api-key "<api key>" --model gpt-image-2
```

Agent direct-entry variant:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider openai-compatible --profile gpt --default-profile \
  --base-url "<openai-compatible base url>" --api-key-stdin --model gpt-image-2
```

OpenAI official:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider openai --profile gpt --default-profile \
  --api-key "<openai api key>" --model gpt-image-2
```

Agent direct-entry variant:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider openai --profile gpt --default-profile \
  --api-key-stdin --model gpt-image-2
```

Google AI Studio:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider google-ai-studio --profile nano --default-profile \
  --api-key "<google api key>" --model gemini-3-pro-image-preview
```

Agent direct-entry variant:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider google-ai-studio --profile nano --default-profile \
  --api-key-stdin --model gemini-3-pro-image-preview
```

Gemini-compatible gateway:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider gemini-compatible --profile nano --default-profile \
  --base-url "<gemini-compatible base url>" --api-key "<api key>" --model gemini-3-pro-image-preview
```

Agent direct-entry variant:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider gemini-compatible --profile nano --default-profile \
  --base-url "<gemini-compatible base url>" --api-key-stdin --model gemini-3-pro-image-preview
```

Vertex AI with Application Default Credentials:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider vertex-ai --profile vertex --default-profile \
  --auth-mode adc --project "<gcp-project>" --location global
```

ChatGPT-compatible endpoint:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider chatgpt-compatible --profile chat --default-profile \
  --base-url "<chat endpoint>" --api-key "<api key>" --model gpt-5.4
```

Agent direct-entry variant:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider chatgpt-compatible --profile chat --default-profile \
  --base-url "<chat endpoint>" --api-key-stdin --model gpt-5.4
```

## Diagnosis Contract

`config doctor --json` is the primary agent API. Use these fields directly:

- `status`: `ok` or `needs_setup`
- `provider` and `provider_label`: active image channel
- `profile`: active named profile
- `effective_config`: masked key, base URL, model, endpoint resolution, and capabilities
- `missing_fields`: `api_key`, `base_url`, `project`, `location`, or other blocking fields
- `missing_dependencies`: Python packages needed for the active provider
- `dependency_install_command`: safe local package-install command
- `requires_user_secret`: true when the next step needs an API key
- `safe_to_autofix`: fields the agent may fill without seeing a secret
- `suggested_commands`: concrete next local command
- `suggested_commands_stdin`: variants that read API keys from stdin for direct agent entry
- `config_path`: persistent config file path, usually `~/.config/bananahub/config.json`
- `secret_entry_modes`: supported direct-entry, placeholder-command, and human-terminal fallback modes
- `ignored_config_sources`: inactive env/profile values; do not make the user debug them unless they explain a failure
- `agent_notes`: setup rules and quota warnings

## Smoke Tests

Non-paid validation:

```bash
python3 {baseDir}/scripts/bananahub.py init --skip-test --json
python3 {baseDir}/scripts/bananahub.py check-mode --pretty
```

Generation smoke test, only with explicit user consent:

```bash
BANANAHUB_PROFILE=gpt python3 {baseDir}/scripts/bananahub.py generate \
  "Create a cute sticker of a tiny cheerful robot holding a banana, rounded kawaii vector style, thick clean outlines, soft pastel colors, plain white background, no text." \
  --model gpt-image-2 \
  --aspect 1:1 \
  --no-fallback \
  --output /tmp/bananahub-gpt-image-2-smoke-test.png
```

Expected generation result: JSON with `status: "ok"`, `actual_model: "gpt-image-2"`, and a readable image file. Telemetry HTTP warnings are non-blocking and should not be mixed with provider-generation failure.

## Next Step After Setup

- For normal generation, follow the installed skill behavior in `SKILL.md`.
- For template discovery, read https://bananahub.ai/llms.txt first.
- For structured catalog matching, read https://bananahub.ai/catalog.json.
- For a readable catalog digest, read https://bananahub.ai/agent-catalog.md.
