# BananaHub Agent Initialization

Stable URL: https://bananahub.ai/agent-init.md
Machine-readable companion: https://bananahub.ai/agent-init.json

Use this file when a user asks an agent to make BananaHub usable from a fresh environment. It covers installation, local API-key setup, diagnosis, and validation. After initialization, use https://bananahub.ai/llms.txt and https://bananahub.ai/catalog.json for template discovery.

## How to Hand This to Another Agent

Minimal handoff:

```text
Read https://bananahub.ai/agent-init.json and initialize BananaHub. Do not ask me to paste API keys into chat; use a local wizard or placeholder command.
```

Recommended handoff:

```text
Read https://bananahub.ai/agent-init.json. If BananaHub Skill is missing, install it using the supported host command. Then run config doctor --json, preserve any valid existing config, guide local API-key entry safely, repair only missing Python runtime dependencies with consent, and validate without paid generation unless I explicitly approve a smoke test.
```

## Scope Boundary

This initialization contract does:

- install BananaHub Skill when the host agent supports the listed install command
- diagnose local BananaHub provider configuration
- create or update BananaHub provider profiles in the local BananaHub config
- guide local API-key entry without exposing secrets in chat
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

- Never ask the user to paste a real API key into chat.
- Prefer a local setup wizard or a terminal command with `<api-key>` placeholders that the user edits locally.
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
4. If `requires_user_secret` is true, do not collect the secret in chat. Run the local wizard:

```bash
python3 {baseDir}/scripts/bananahub.py init --wizard
```

5. If dependencies are missing and the user allows local package installation, use:

```bash
python3 {baseDir}/scripts/bananahub.py init --wizard --install-deps
```

6. If the user already knows the provider, endpoint, and model, give them the relevant `config quickset` command below and ask them to fill the placeholder values in their terminal.
7. Validate without paid image generation:

```bash
python3 {baseDir}/scripts/bananahub.py init --skip-test --json
python3 {baseDir}/scripts/bananahub.py config show
```

If `init --skip-test --json` returns `status: "incomplete"` only because `missing_dependencies` is non-empty, the API-key setup can still be saved correctly. Install the packages from `dependency_install_command` or rerun:

```bash
python3 {baseDir}/scripts/bananahub.py init --skip-test --install-deps
```

If package installation fails with a PEP 668 `externally-managed-environment` error, do not add `--break-system-packages` automatically. Ask the user whether to use their agent's Python environment, a virtual environment, or the operating-system package manager, then rerun `config doctor --json`.

8. Only after explicit consent, run a provider healthcheck or image-generation smoke test.

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

OpenAI official:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider openai --profile gpt --default-profile \
  --api-key "<openai api key>" --model gpt-image-2
```

Google AI Studio:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider google-ai-studio --profile nano --default-profile \
  --api-key "<google api key>" --model gemini-3-pro-image-preview
```

Gemini-compatible gateway:

```bash
python3 {baseDir}/scripts/bananahub.py config quickset --provider gemini-compatible --profile nano --default-profile \
  --base-url "<gemini-compatible base url>" --api-key "<api key>" --model gemini-3-pro-image-preview
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
