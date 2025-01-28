from typing import Optional
from pydantic import BaseModel, Field


class CreateCustomer(BaseModel):
    """Schema for the ``create_customer`` operation."""

    name: str = Field(
        ...,
        description="The name of the customer.",
    )

    email: Optional[str] = Field(
        None,
        description="The email of the customer.",
    )


class ListCustomers(BaseModel):
    """Schema for the ``list_customers`` operation."""

    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100, and the default is 10."
        ),
    )

    email: Optional[str] = Field(
        None,
        description=(
            "A case-sensitive filter on the list based on"
            " the customer's email field. The value must be a string."
        ),
    )


class CreateProduct(BaseModel):
    """Schema for the ``create_product`` operation."""

    name: str = Field(
        ...,
        description="The name of the product.",
    )
    description: Optional[str] = Field(
        None,
        description="The description of the product.",
    )


class ListProducts(BaseModel):
    """Schema for the ``list_products`` operation."""

    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100, and the default is 10."
        ),
    )


class CreatePrice(BaseModel):
    """Schema for the ``create_price`` operation."""

    product: str = Field(
        ..., description="The ID of the product to create the price for."
    )
    unit_amount: int = Field(
        ...,
        description="The unit amount of the price in cents.",
    )
    currency: str = Field(
        ...,
        description="The currency of the price.",
    )


class ListPrices(BaseModel):
    """Schema for the ``list_prices`` operation."""

    product: Optional[str] = Field(
        None,
        description="The ID of the product to list prices for.",
    )
    limit: Optional[int] = Field(
        None,
        description=(
            "A limit on the number of objects to be returned."
            " Limit can range between 1 and 100, and the default is 10."
        ),
    )


class CreatePaymentLink(BaseModel):
    """Schema for the ``create_payment_link`` operation."""

    price: str = Field(
        ...,
        description="The ID of the price to create the payment link for.",
    )
    quantity: int = Field(
        ...,
        description="The quantity of the product to include.",
    )


class CreateInvoice(BaseModel):
    """Schema for the ``create_invoice`` operation."""

    customer: str = Field(
        ..., description="The ID of the customer to create the invoice for."
    )

    days_until_due: Optional[int] = Field(
        None,
        description="The number of days until the invoice is due.",
    )


class CreateInvoiceItem(BaseModel):
    """Schema for the ``create_invoice_item`` operation."""

    customer: str = Field(
        ...,
        description="The ID of the customer to create the invoice item for.",
    )
    price: str = Field(
        ...,
        description="The ID of the price for the item.",
    )
    invoice: str = Field(
        ...,
        description="The ID of the invoice to create the item for.",
    )


class FinalizeInvoice(BaseModel):
    """Schema for the ``finalize_invoice`` operation."""

    invoice: str = Field(
        ...,
        description="The ID of the invoice to finalize.",
    )


class RetrieveBalance(BaseModel):
    """Schema for the ``retrieve_balance`` operation."""

    pass
