# Setting up and running the app on your machine

This document describes how to set up your development environment to run and test Nudge.
It also explains the basic mechanics of using `git`, `node`.

- [Prerequisite Software](#prerequisite-software)
- [Getting the Sources](#getting-the-sources)
- [Installing NPM Modules](#installing-npm-modules)
- [Spinnng up the Database](#spinnng-up-the-database)
- [Setting up environment variables](#setting-up-the-environment-variables)
- [Starting the server](#starting-the-server)

## Prerequisite Software

Before you can run and test Nudge, you must install and configure the
following products on your development machine:

- [Git](http://git-scm.com) and/or the **GitHub app** (for [Mac](http://mac.github.com) or
  [Windows](http://windows.github.com)); [GitHub's Guide to Installing
  Git](https://help.github.com/articles/set-up-git) is a good source of information.
- [Node.js](http://nodejs.org), (version specified in the engines field of [`package.json`](../package.json)) which is used to run a development web server,
  run tests, and generate distributable files.
- [Yarn](https://yarnpkg.com)
- [MongoDB](https://docs.mongodb.com/manual/installation/) which is used as a NoSQL database.

## Getting the Sources

Clone the repository:

1. Login to your GitHub account or create one by following the instructions given
   [here](https://github.com/signup/free).
2. Clone the repository

```shell
# Clone your GitHub repository:
git clone git@github.com:CFGIndia20/team-28.git
```

```
# Go to the Apply-by-AI directory:
cd team-28
```

## Installing NPM Modules using Yarn

Next, install the JavaScript modules needed to build and test Nudge:

```shell
# Install project dependencies (package.json)
yarn install
```

## Spinnng up the Database

Assuming that you already have your MongoDB database installed, spin up the mongo daemon

```shell
mongod
```

## Setting up environment variables

You need to set up Google clientId, secret and callback url in order to work with Google login.
Ref: https://developers.google.com/identity/protocols/oauth2

```shell
cp .env.template .env
```

## Starting the server

```
yarn run dev
```
