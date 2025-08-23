# Scripts

`create-key.sh`: Uses `firefly` to create a new key with a given name and under
a given organization (by UUID). The resulting key is written to a file named as
`<keyname>.json`.

`create-key-address.sh`: Retrieves the address of a key from a given key file.

`get-identities.sh`: This script fetches all identities from a Firefly instance and saves them to a file.

`get-org-uuids-from-identities.sh`: This script retrieves the UUID of an organization by its name from the `identities.json` file (created by `get-identities.sh`)

`get-org-uuid-by-name.sh`: This script retrieves the UUID of an organization by its name from the `identities.json` file.

`register-key.sh`: Registers a previously created keypair
(e.g., using `create-key.sh`) at a Firefly instance.

`create-register-key.sh`: This script creates a keypair and registers it at a Firefly instance.
