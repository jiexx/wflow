import { IMessageData, Bus, BusService, IBusMessage } from '../bus/bus';

export interface IDialogMessageData extends IMessageData {
    returnto : Bus;
    [key: string] :  any;
}

export interface IDialogMessage extends IBusMessage {
    data : IDialogMessageData;
}

export interface IDialog {
    msg: IDialogMessage;
    open(msg: IDialogMessage) : void;
    close() : void;
}
