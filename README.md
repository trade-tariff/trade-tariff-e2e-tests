# trade-tariff-e2e-tests

[![Check Production](https://github.com/trade-tariff/trade-tariff-e2e-tests/actions/workflows/check-production.yml/badge.svg)](https://github.com/trade-tariff/trade-tariff-e2e-tests/actions/workflows/check-production.yml)

> Remember to install pre-commit hooks before making any changes to the
> repository

Playwright suite used to validate the end to end functionality of the OTT
Service.

The OTT service answers two main questions:

1. What am I trading?
2. What measures apply to me?

This suite validates some of the core journeys that help the user answer these
questions.

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

## Running tests

This repository contains a [Makefile](./Makefile) to simplify running the test
suite.

You can run the tests by running `make test` in the repository root. This
will use some defaults that are configured in the Makefile - for example,
the default environment to run tests against is `development`, and the default
project runs the main suite of tests.

To run the admin tests, use the `project` variable:

```sh
make test project=admin
```

To run against a different environment, supply the `environment` variable:

```sh
make test environment=staging
```

You can alter the number of Playwright workers with the `workers` variable:

```sh
make test workers=2
```

## Running tests in debug mode

```bash
yarn run playwright test --headed --debug
```
