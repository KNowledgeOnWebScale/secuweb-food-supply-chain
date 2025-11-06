
echo "VERIFY"
source ./.dev.temp.env
echo "SUBJECT_DID=$SUBJECT_DID"

TMP_VR_1=$(mktemp)
echo "VERIFY ON-CHAIN HASH"
VC_IN="$VC" SUBJECT_DID="$SUBJECT_DID" ANCHOR_REPO="$ANCHOR_REPO" ./src/scripts/verify.one.sh > $TMP_VR_1

echo "VERIFY VC PROOF"
TMP_VR_2=$(mktemp)
cd $VC_LIB
node dist/cli.js verify -m $VC_MODE -c $SOLID_CONFIG -i $VC > $TMP_VR_2 2>&1

echo "===== VERIFY ON-CHAIN HASH ====="
cat $TMP_VR_1
echo "===== VERIFY VC PROOF ====="
cat $TMP_VR_2

if jq -e '.subjectMatches == true' $TMP_VR_1 > /dev/null; then
    echo "✅ subjectMatches is true"
    OK1=true
else
    echo "❌ subjectMatches is false or missing"
    OK1=false
fi

if grep -Eiq 'Verification[[:space:]]+result:[[:space:]]*pass\.?' "$TMP_VR_2"; then
    echo "[ok] Verification result: pass"
    OK2=true
    
else
    echo "[error] Verification result: fail"
    OK2=false
fi


rm -f $TMP_VR_1 $TMP_VR_2
if [ "$OK1" = true ] && [ "$OK2" = true ]; then
    echo "✅ VC verification succeeded"
    exit 0
else
    echo "❌ VC verification failed"
    exit 1
fi

