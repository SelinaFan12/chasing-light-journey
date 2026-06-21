# Contributing

Thanks for helping improve this project.

## Development

1. Import the project with WeChat DevTools.
2. Use `touristappid` for local preview, or replace it with your own mini program appid.
3. Keep real secrets in local environment variables or cloud-function settings.
4. Run JavaScript syntax checks before opening a pull request:

```bash
node --check app.js
node --check utils/data.js
node --check utils/spots-service.js
node --check pages/index/index.js
node --check pages/spot-detail/spot-detail.js
```

## Pull Requests

- Keep changes focused.
- Do not commit `.env`, `project.private.config.json`, screenshots with private account data, or cloud credentials.
- For new location data or photos, confirm that the data and media are legally reusable.
