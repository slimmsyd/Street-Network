import stripe


def create_customer(name: str, email: str = None):
    """
    Create a customer.

    Parameters:
        name (str): The name of the customer.
        email (str, optional): The email address of the customer.

    Returns:
        stripe.Customer: The created customer.
    """
    customer = stripe.Customer.create(name=name, email=email)
    return {"id": customer.id}


def list_customers(email: str = None, limit: int = None):
    """
    List Customers.

    Parameters:
        email (str, optional): The email address of the customer.
        limit (int, optional): The number of customers to return.

    Returns:
        stripe.ListObject: A list of customers.
    """
    customers = stripe.Customer.list(email=email, limit=limit)
    return [{"id": customer.id} for customer in customers.data]


def create_product(name: str, description: str = None):
    """
    Create a product.

    Parameters:
        name (str): The name of the product.
        description (str, optional): The description of the product.

    Returns:
        stripe.Product: The created product.
    """
    return stripe.Product.create(name=name, description=description)


def list_products(limit: int = None):
    """
    List Products.
    Parameters:
        limit (int, optional): The number of products to return.

    Returns:
        stripe.ListObject: A list of products.
    """
    return stripe.Product.list(limit=limit).data


def create_price(product: str, currency: str, unit_amount: int):
    """
    Create a price.

    Parameters:
        product (str): The ID of the product.
        currency (str): The currency of the price.
        unit_amount (int): The unit amount of the price.

    Returns:
        stripe.Price: The created price.
    """
    return stripe.Price.create(
        product=product, currency=currency, unit_amount=unit_amount
    )


def list_prices(product: str = None, limit: int = None):
    """
    List Prices.

    Parameters:
        product (str, optional): The ID of the product to list prices for.
        limit (int, optional): The number of prices to return.

    Returns:
        stripe.ListObject: A list of prices.
    """
    return stripe.Price.list(product=product, limit=limit).data


def create_payment_link(price: str, quantity: int):
    """
    Create a payment link.

    Parameters:
        price (str): The ID of the price.
        quantity (int): The quantity of the product.

    Returns:
        stripe.PaymentLink: The created payment link.
    """
    payment_link = stripe.PaymentLink.create(
        line_items=[{"price": price, "quantity": quantity}]
    )
    return {"id": payment_link.id, "url": payment_link.url}


def create_invoice(customer: str, days_until_due: int = 30):
    """
    Create an invoice.

    Parameters:
        customer (str): The ID of the customer.
        days_until_due (int, optional): The number of days until the
        invoice is due.

    Returns:
        stripe.Invoice: The created invoice.
    """
    invoice = stripe.Invoice.create(
        customer=customer,
        collection_method="send_invoice",
        days_until_due=days_until_due,
    )

    return {
        "id": invoice.id,
        "hosted_invoice_url": invoice.hosted_invoice_url,
        "customer": invoice.customer,
        "status": invoice.status,
    }


def create_invoice_item(customer: str, price: str, invoice: str):
    """
    Create an invoice item.

    Parameters:
        customer (str): The ID of the customer.
        price (str): The ID of the price.
        invoice (str): The ID of the invoice.

    Returns:
        stripe.InvoiceItem: The created invoice item.
    """
    invoice_item = stripe.InvoiceItem.create(
        customer=customer,
        price=price,
        invoice=invoice,
    )
    return {"id": invoice_item.id, "invoice": invoice_item.invoice}


def finalize_invoice(invoice: str):
    """
    Finalize an invoice.

    Parameters:
        invoice (str): The ID of the invoice.

    Returns:
        stripe.Invoice: The finalized invoice.
    """
    invoice_object = stripe.Invoice.finalize_invoice(invoice=invoice)

    return {
        "id": invoice_object.id,
        "hosted_invoice_url": invoice_object.hosted_invoice_url,
        "customer": invoice_object.customer,
        "status": invoice_object.status,
    }


def retrieve_balance():
    """
    Retrieve the balance.

    Returns:
        stripe.Balance: The balance.
    """
    return stripe.Balance.retrieve()
