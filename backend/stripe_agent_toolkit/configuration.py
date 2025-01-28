from typing import TypedDict, Literal, Optional

# Define Object type
Object = Literal[
    "customers",
    "invoices",
    "invoiceItems",
    "paymentLinks",
    "products",
    "prices",
    "balance",
]


# Define Permission type
class Permission(TypedDict, total=False):
    create: Optional[bool]
    update: Optional[bool]
    read: Optional[bool]


# Define BalancePermission type
class BalancePermission(TypedDict, total=False):
    read: Optional[bool]


# Define Actions type
class Actions(TypedDict, total=False):
    customers: Optional[Permission]
    invoices: Optional[Permission]
    invoice_items: Optional[Permission]
    payment_links: Optional[Permission]
    products: Optional[Permission]
    prices: Optional[Permission]
    balance: Optional[BalancePermission]


# Define Configuration type
class Configuration(TypedDict, total=False):
    actions: Optional[Actions]


def is_tool_allowed(tool, configuration):
    for resource, permissions in tool.get("actions").items():
        if resource not in configuration.get("actions", {}):
            return False
        for permission in permissions:
            if (
                not configuration["actions"]
                .get(resource, {})
                .get(permission, False)
            ):
                return False
    return True
