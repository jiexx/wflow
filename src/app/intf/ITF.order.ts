interface IOrder {
    id: string;
    time: string;
    money: number;
    products: Array<IOrderProduct>;
    userId: string;
}

interface IOrderProduct {
    productId: string;
    count: number;
}

interface IUserOrder {
    userId: string;
    total: number;
    pageNumber: number;
    orders: Array<IOrder>;
}