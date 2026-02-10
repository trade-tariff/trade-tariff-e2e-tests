# trade-tariff-e2e-tests

[![Check Production](https://github.com/trade-tariff/trade-tariff-e2e-tests/actions/workflows/check-production.yml/badge.svg)](https://github.com/trade-tariff/trade-tariff-e2e-tests/actions/workflows/check-production.yml)

> Remember to install pre-commit hooks before making any changes to the repository.

Playwright suite used to validate the end to end functionality of the OTT Service

The OTT service essentially answers two principle questions:

1. What am I trading?
2. What measures apply to me?

This suite validates some of the core journeys that help the user answer these questions.

The OTT frontend is accessible on the following URLs:

- [development][development]
- [staging][staging]
- [production][production]

Implementation details for the frontend and backend can be reviewed, here:

- [frontend][frontend-github]
- [backend][backend-github]

[development]: https://dev.trade-tariff.service.gov.uk/
[staging]: https://staging.trade-tariff.service.gov.uk/
[production]: https://www.trade-tariff.service.gov.uk/
[frontend-github]: https://github.com/trade-tariff/trade-tariff-frontend
[backend-github]: https://github.com/trade-tariff/trade-tariff-backend

## Installing prerequisites

```bash
yarn install
yarn run playwright install
```

### SSL Certificate Issues

If you encounter SSL certificate errors when running `yarn install` (e.g., "self-signed certificate in certificate chain"), this is typically caused by corporate proxies with SSL inspection.

**Workaround:** Create a `.yarnrc` file in the project root with the following content:

```
strict-ssl false
```

This will disable SSL certificate verification for yarn in this project. Note that this is a **local configuration file** that should not be committed to the repository.

**Alternative solution:**
- Add your organization's CA certificate to your system's trust store (recommended for production use)

## Running tests

```bash
yarn run test-development
yarn run test-staging
yarn run test-production
```

## Running tests in debug mode

```bash
yarn run playwright test --headed --debug
```
