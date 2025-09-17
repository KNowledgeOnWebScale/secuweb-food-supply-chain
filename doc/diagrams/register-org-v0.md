Source diagram: https://drive.google.com/file/d/1byDGbLtqIUtW2WxtkAtJ5TFIHaYxC3NB/view?usp=drive_link

Flow: Register Organization
Actor A creates a cryptographic key pair
Actor A registers itself at the BC by registering its public key
Upon success, the BC response will contain a FireFly DID
Actor A updates its WebID Profile Document by referencing the FireFly DID (from step 3)
A's Solid Pod returns a successful response (assumption!)
Actor A creates a verifiable credential, VC_IDB, that binds its WebID and FireFly DID
Actor A posts VC_IDB to its Solid Pod
Upon success, A’s Solid Pod responds with the URI to VC_IDB
Actor A broadcasts the URI to the VC_IDB
