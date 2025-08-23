# README

## Scripts

`register-css-users.sh`: comprises a composite workflow consisting of the following
assumptions and steps:

- Prerequirements:
  - Running FireFly stack:
    - Stack: `dev2`
    - Host: http://localhost:10000
- Steps
  - usernames: extracted from `./css/css-users.json`
  - for each username in usernames
    - Extract `{ email, password }` from `./css/css-users.json`
    - Execute `./create-register-key.sh $STACK $USERNAME`
    - Extract the (FireFly) DID from the identity record
    - Add the Firefly DID to the user's WebID profile
