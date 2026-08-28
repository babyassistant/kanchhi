import sys
import requests


BASE_URL = (
    sys.argv[1]
    if len(sys.argv) > 1
    else "http://localhost:8000"
)


PASS = 0
FAIL = 0


def test(
    name: str,
    condition: bool,
    detail: str = "",
):

    global PASS
    global FAIL

    if condition:

        PASS += 1

        print(
            f"✅ PASS: {name}"
        )

        if detail:
            print(
                f"   {detail}"
            )

    else:

        FAIL += 1

        print(
            f"❌ FAIL: {name}"
        )

        if detail:
            print(
                f"   {detail}"
            )


def request_json(
    path: str,
):

    response = requests.get(
        f"{BASE_URL}{path}",
        timeout=10,
    )

    response.raise_for_status()

    return response.json()


print()
print(
    "=========================================="
)
print(
    " KANCHHI SYSTEM MONITORING TEST"
)
print(
    "=========================================="
)
print(
    f"Backend: {BASE_URL}"
)
print()


# ============================================================
# ROOT
# ============================================================

try:

    root = request_json("/")

    test(
        "Backend root",
        isinstance(root, dict),
        str(root),
    )

except Exception as error:

    test(
        "Backend root",
        False,
        str(error),
    )


# ============================================================
# HEALTH
# ============================================================

try:

    health = request_json(
            "/api/system/health"
        )

    test(
        "Health endpoint",
        isinstance(
            health,
            dict,
        ),
    )

    test(
        "Health status",
        health.get("status")
        in (
            "healthy",
            "warning",
            "degraded",
        ),
        str(
            health.get("status")
        ),
    )

    summary = health.get(
            "summary",
            {},
        )

    total = summary.get(
            "total",
            0,
        )

    online = summary.get(
            "online",
            0,
        )

    test(
        "Health summary",
        total >= 1
        and online >= 0,
        f"total={total}, online={online}",
    )

except Exception as error:

    test(
        "Health endpoint",
        False,
        str(error),
    )


# ============================================================
# DETAILED CHECKS
# ============================================================

try:

    checks = request_json(
            "/api/system/checks?external=true"
        )

    test(
        "Detailed checks endpoint",
        isinstance(
            checks.get("checks"),
            list,
        ),
        str(
            len(
                checks.get(
                    "checks",
                    [],
                )
            )
        ) + " checks",
    )

    test(
        "Detailed check summary",
        isinstance(
            checks.get("summary"),
            dict,
        ),
    )

    for check in checks.get(
        "checks",
        [],
    ):

        test(
            f"Check: {check.get('name')}",
            check.get("status")
            in (
                "online",
                "warning",
                "offline",
            ),
            (
                f"status={check.get('status')}, "
                f"duration={check.get('duration_ms')} ms"
            ),
        )

except Exception as error:

    test(
        "Detailed checks endpoint",
        False,
        str(error),
    )


# ============================================================
# SINGLE CHECKS
# ============================================================

single_checks = [

    "backend",
    "ai",
    "search",
    "memory",
    "notifications",
    "preferences",
    "weather",
    "onlinekhabar",
    "ronb",
    "ratopati",
]


for check_name in single_checks:

    try:

        result = request_json(
                f"/api/system/checks/{check_name}"
            )

        check = result.get(
                    "check"
            )

        test(
            f"Single check: {check_name}",
            isinstance(
                check,
                dict,
            )
            and check.get(
                "status"
            )
            in (
                "online",
                "warning",
                "offline",
            ),
        )

    except Exception as error:

        test(
            f"Single check: {check_name}",
            False,
            str(error),
        )


# ============================================================
# FINAL RESULT
# ============================================================

print()
print(
    "=========================================="
)
print(
    f" PASSED: {PASS}"
)
print(
    f" FAILED: {FAIL}"
)
print(
    "=========================================="
)
print()


if FAIL > 0:

    sys.exit(1)

else:

    print(
        "🎉 KANCHHI system monitoring tests passed."
    )

    sys.exit(0)