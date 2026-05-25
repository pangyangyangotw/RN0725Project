import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    Text,
    TouchableHighlight,
    DeviceEventEmitter
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import CustomText from '../../custom/CustomText';
import CustomeTextInput from '../../custom/CustomTextInput';
import Theme from '../../res/styles/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomActioSheet from '../../custom/CustomActionSheet';
import HotelService from '../../service/HotelService';
import NavigationUtils from '../../navigator/NavigationUtils';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import PickerHelper from '../../common/PickerHelper';
import CommonService from '../../service/CommonService';
import ChinaBankList from '../../res/js/ChinaBankList';
import Util from '../../util/Util';
import ComprehensiveService from '../../service/ComprehensiveService';
import AntDesign from 'react-native-vector-icons/AntDesign';
import BackPress from '../../common/BackPress';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default class HotelGuranteeScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.compRequestModle = Util.Encryption.clone(this.params.compRequestModle);
        this._navigationHeaderView = {
            title: "信用卡信息"
        }
        this.state = {
            cardName: null,
            IdName: "",
            // cvv: '',
            validYear: '',
            validMonth: '',
            Name: '',
            SeriNumber: '',
            Type: "身份证",
            Mobile: '',
            options: ['身份证', '护照', '其它'],
            GuaranteeTypeArr: [],
            yilong: false,
            // bankStr:null,
            isUnionPay: false,
            guaranteeOptions: [
                '万事达卡(Master Card)',
                '日财卡(Japanese Credit Bureau Credit Card)',
                '美国运通卡(American Express)',
                '大莱卡(Diners Club)',
                '发现卡(Discover Card)',
                '维萨卡(Visa)',
                '中国银联卡(China Union Pay Card)',
                '环球航空旅行计划卡(Universal Air Travel Card)',
            ],
            isStop: false,
            haveRead:false,
            isTraveller:false
        }
        this.backPress = new BackPress({ backPress: () => this._stopBackEvent() })
    }

    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: false
        }
    }
    _stopBackEvent = () => {
        const { callBack } = this.params
        if (!this.state.isStop) {
            callBack(true)//标识，true的时候物理返回键isStop是true
            this.pop();
        }
        return true;
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
        PickerHelper.hide();
    }

    componentDidMount() {
        this.backPress.componentDidMount();
        const { Guarantee, compRequestModle, compOrder } = this.params
        // let TVPCardTypeList = ['VI','JC','AX','DC','DS','MC']//TVP时默认显示卡
        // let BKCardTypeList = ['VI','AX','DC','DS','TP','MC']//BK时默认显示卡
        let RatePlan;
        if (compOrder == 1) {//判断是不是单元订单
            RatePlan = compRequestModle && compRequestModle.RatePlan
        } else {
            RatePlan = compRequestModle.Hotel && compRequestModle.Hotel.RatePlan
        }
        if (Guarantee) {
            /**
             * 删除原来逻辑从后端获取
             */
            // if(Guarantee.Desc.includes('CC ACCEPTED')){
            //     let cardTypeStr = Guarantee.Desc.substring(Guarantee.Desc.indexOf("CC ACCEPTED") + 12);
            //     let cardTypeArr = cardTypeStr.split(" ");
            //     this.setState({
            //         GuaranteeTypeArr:cardTypeArr,
            //         yilong:RatePlan.VendorCode=="YLONG"?true:false,
            //     })
            // }else if(RatePlan&&RatePlan.VendorCode){
            //     if(RatePlan.VendorCode==='TVP'){
            //         this.setState({
            //             GuaranteeTypeArr:TVPCardTypeList,
            //         })
            //     }
            //     if(RatePlan.VendorCode==='BK'){
            //         this.setState({
            //             GuaranteeTypeArr:BKCardTypeList,
            //         })
            //     }
            //     if(RatePlan.VendorCode=="YLONG"){//艺龙只接收银联卡
            //         this.setState({
            //             yilong:true,
            //         })
            //     }
            // }

            this.setState({
                yilong: RatePlan && (RatePlan.VendorCode == 'YLONG' || RatePlan.VendorName == 'Elong') ? true : false,
                isUnionPay: Guarantee.IsUnionPay,
                GuaranteeTypeArr: Guarantee.AcceptedCardTypes
            })
        }
    }
    /**
     * 选择证件类型
     */
    _selectType = () => {
        const { yilong } = this.state
        if (yilong) {
            this.toastMsg('根据供应商要求，本房型担保证件类型仅支持身份证。')
            return;
        }
        this.actionSheet.show();
    }

    _handlePress = (index) => {
        this.setState({
            Type: this.state.options[index]
        })
    }

    _selectCard = () => {
        if(this.state.isTraveller){
            return;
        }
        const { yilong } = this.state;
        this.push('HotelSelectCardScreen', {
            cardName: this.state.cardName,
            GuaranteeTypeArr: this.state.GuaranteeTypeArr,
            yilong: yilong,
            callBack: (obj) => {
                this.setState({
                    cardName: obj
                })
            }
        })
    }

    _submitButton = () => {
        const { IdName, validMonth, validYear, Name, SeriNumber, Type, cardName, Mobile, yilong, isUnionPay, guaranteeOptions ,haveRead} = this.state;
        let elongBank = ['中国工商银行', '中国银行', '交通银行', '兴业银行', '招商银行', '广东发展银行', '中国民生银行', '中信银行'];
        if (!IdName) {
            this.toastMsg('信用卡卡号不能为空');
            return;
        }
        if (!isUnionPay && !yilong) {
            if (!cardName) {
                this.toastMsg('请选择信用卡类型');
                return;
            } else if (cardName.Name === guaranteeOptions[5]) {//Visa以4开头，有16位数字
                var stuCardReg = /^4\d{15}$/
                var stuCardReg2 = /^4\d{11}$/
                if (!stuCardReg.test(IdName) && !stuCardReg2.test(IdName)) {
                    this.toastMsg('信用卡卡号格式有误，请重新输入');
                    return;
                }
            }
            // else if(cardName.Name===guaranteeOptions[1] || cardName.Name===guaranteeOptions[8]){//数字51到55或2221到2720开头。全部有16位数字 万事达卡
            //     var stuCardReg = /^5[1-5][0-9]{14}|^(222[1-9]|22[3-9]\\d|2[3-6]\\d{2}|27[0-1]\\d|2720)[0-9]{12}$/
            //     if (!stuCardReg.test(IdName)) {
            //         this.toastMsg('信用卡卡号格式有误，请重新输入');
            //         return;
            //     }
            else if (cardName.Name === guaranteeOptions[0]) {//数字51到55或2221到2720开头。全部有16位数字 万事达卡
                var stuCardReg = /^5[1-5][0-9]{14}|^(222[1-9]|22[3-9]\\d|2[3-6]\\d{2}|27[0-1]\\d|2720)[0-9]{12}$/
                if (!stuCardReg.test(IdName)) {
                    this.toastMsg('信用卡卡号格式有误，请重新输入');
                    return;
                }
            } else if (cardName.Name === guaranteeOptions[1]) {//JCB以35开头，有16位数字 以2131或1800开头的15位
                var stuCardReg = /^35\d{14}$/
                var stuCardReg2 = /^2131\d{11}$/
                var stuCardReg3 = /^1800\d{11}$/
                if (!stuCardReg.test(IdName) && !stuCardReg2.test(IdName) && !stuCardReg3.test(IdName)) {
                    this.toastMsg('信用卡卡号格式有误，请重新输入');
                    return;
                }
            } else if (cardName.Name === guaranteeOptions[2]) {//美国运通卡号以34或37开头，有15位数字
                var stuCardReg1 = /^34\d{13}$/
                var stuCardReg2 = /^37\d{13}$/
                if (!stuCardReg1.test(IdName) && !stuCardReg2.test(IdName)) {
                    this.toastMsg('信用卡卡号格式有误，请重新输入');
                    return;
                }
            } else if (cardName.Name === guaranteeOptions[3]) {//卡号从300到305、36或38开头，全部有14个数字。或者以5开头有16位数字 大来卡
                var stuCardReg = /^5\d{15}$/
                var stuCardReg2 = /^30[0-5]\d{11}$/
                var stuCardReg3 = /^36\d{12}$/
                var stuCardReg4 = /^38\d{12}$/
                if (!stuCardReg.test(IdName) &&
                    !stuCardReg2.test(IdName) &&
                    !stuCardReg3.test(IdName) &&
                    !stuCardReg4.test(IdName)
                ) {
                    this.toastMsg('信用卡卡号格式有误，请重新输入');
                    return;
                }
            } else if (cardName.Name === guaranteeOptions[4]) { //发现卡
                var stuCardReg = /^65\d{14}$/
                var stuCardReg2 = /^6011\d{12}$/
                if (!stuCardReg.test(IdName) && !stuCardReg2.test(IdName)) {
                    this.toastMsg('信用卡卡号格式有误，请重新输入');
                    return;
                }
            }
        }

        // if (!cvv && (isUnionPay||yilong)) {
        //     this.toastMsg('CVV码不能为空');
        //     return;
        // }
        if (!validYear) {
            this.toastMsg('有效年份不能为空');
            return;
        }
        if (!validMonth) {
            this.toastMsg('有效月份不能为空');
            return;
        }
        if (!Name) {
            this.toastMsg('持卡人姓名不能为空');
            return;
        }
        if (!SeriNumber && yilong) {
            this.toastMsg('证件号不能为空');
            return;
        }
        let idType = '';
        if (Type === '身份证') {
            idType = 'IdentityCard';
        } else if (Type === '护照') {
            idType = 'Passport';
        } else {
            idType = 'Other';
        }
        if (yilong && !Mobile) {
            this.toastMsg('手机号不能为空');
            return;
        }
        if (Mobile && !Util.RegEx.isMobile(Mobile)) {
            this.toastMsg('手机号格式不正确');
            return;
        }
        let models = {
            // OrderId: this.params.OrderId,
            CreditCard: {
                Number: IdName,
                HolderName: Name,
                IdType: idType,
                IdNo: SeriNumber,
                // CVV: cvv,
                ExpirationYear: String(validYear),
                ExpirationMonth: String(validMonth),
                CardType: isUnionPay ? 'UP' : cardName?.CardType,
                Mobile: Mobile,
                NeedSaveToProfile:haveRead
            },
            IsUnionPay: isUnionPay
        }
        let validate = {
            CreditCardNo: IdName,
        }
        if (isUnionPay || yilong || cardName.Name === guaranteeOptions[6]) {
            let model = {
                cardNo: IdName,
            }
            CommonService.validateAndCacheCardInfo(model).then(response => {
                this.hideLoadingView();
                if (!response || !response.validated) {
                    this.toastMsg(' 卡号录入错误，请检查');
                    return;

                } else if (response && response.validated) {
                    ChinaBankList.map(item => {
                        if (item.name == response.bank) {
                            if (yilong) {
                                if (elongBank.includes(item.value)) {
                                    this.clickSure(validate, models)
                                } else {
                                    this.toastMsg('只接受发卡行（中信银行，中国银行，中国工商银行，中国民生银行，兴业银行，广发银行，招商银行，交通银行）的银联卡，请更换');
                                    return;
                                }
                            } else {
                                this.clickSure(validate, models)
                            }
                        }
                    })
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message);
            })
        } else {
            this.clickSure(validate, models)
        }
    }

    clickSure = (validate, model) => {
        this.showLoadingView();
        HotelService.getCreditCardValidate(validate).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                // if (response.data.IsValid == 0) {
                //     this.toastMsg("信用卡号验证失败");
                //     return;
                // }
                if (response.data.IsNeedVerifyCode != 0) {
                    model.IsNeedVerifyCode = response.data.IsNeedVerifyCode;
                }
                if (this.params.compOrder === 1) {
                    this._updateHotel(model)
                } else {
                    this._updateHotelOrder(model)//综合
                }
            } else {
                this.toastMsg(response.message || '信用卡卡号验证失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '操作失败');
        })
    }

    _updateHotel = (model) => {
        this.showLoadingView();
        this.params.compRequestModle.CreditCard = model.CreditCard
        HotelService.getHotelOrderCreate(this.params.compRequestModle).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.setState({
                    isStop: true
                }, () => {
                    this.showAlertView('订单生成成功，您可去我的订单中查看', () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.dismissAlertView();
                            DeviceEventEmitter.emit('refreshHotelOrderList');
                            NavigationUtils.popToTop(this.props.navigation);
                        }, '确定', () => {
                            if (this.params.compRequestModle.Order.Domestic) {
                                this.push('HotelOrderListScreen', { isStop: true });
                            } else {
                                this.push('InterHotelOrderListScreen', { isStop: true });
                            }
                            this.dismissAlertView();
                        })
                    })
                })
            } else {
                if (response.code == 5) {
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.params.compRequestModle.IgnoreConfirm = 0;
                            this.dismissAlertView();
                            this.pop();
                        }, '确定', () => {
                            this.params.compRequestModle.IgnoreConfirm = 1;
                            this.dismissAlertView();
                            this._updateHotel(model);
                        })
                    })
                } 
                else {
                    this.showAlertView(response.message || '提交订单失败出错,请重试!', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            //默认改成false
                            this.params.compRequestModle.CreditCard.NeedSaveToProfile = false;
                            this.params.compRequestModle.IgnoreConfirm = 0;
                        });
                    });
                }
            }
        }).catch(error => {
            this.hideLoadingView();
            // this.requestModel.IgnoreConfirm = 0;
            this.toastMsg(error.message || '提交订单失败出错,请重试!');
        })

    }

    _updateHotelOrder = (model) => {
        this.params.compRequestModle.Hotel.CreditCard = model.CreditCard
        // let strMes2 = '请点击“下一步”继续提交您的订单。部分酒店供应商可能会要求使用验证码以完成酒店预定，请注意查收邮件及短信，并根据指引填写验证码。'
        this.showLoadingView();
        ComprehensiveService.MassOrderCreate(this.params.compRequestModle).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.setState({
                    isStop: true
                }, () => {
                    DeviceEventEmitter.emit('freshCompDetail', {orderId: response.data.Id, isStop: true});
                    this.push('CompDetailScreen', { orderId: response.data.Id, isStop: true });
                    // this.showAlertView(strMes2, () => {
                    //     return ViewUtil.getAlertButton('下一步', () => {
                    //         this.dismissAlertView();
                    //     })
                    // })
                })
            }else{
                this.params.compRequestModle.Hotel.CreditCard.NeedSaveToProfile = false; 
                this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView()
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }

    pickerYear = () => {
        if(this.state.isTraveller){
            return;
        }
        PickerHelper.create(PickerHelper.createYYYYDate(), null, (data) => {
            if (data) {
                this.setState({
                    validYear: data[0]
                });
            }
        })
    }

    pickerMonth = () => {
        if(this.state.isTraveller){
            return;
        }
        PickerHelper.create(PickerHelper.createMMDate(), null, (data) => {
            if (data) {
                this.setState({
                    validMonth: data[0]
                });
            }
        })
    }

    _cardChange = (cardType) => {
        let HotelCardTypeList = [
            { Name: '维萨卡(Visa)', Value: 11, CardType: 'VI' },
            { Name: '万事达卡(Master Card)', Value: 9, CardType: 'CA' },
            { Name: '万事达卡(Master Card)', Value: 9, CardType: 'MC' },
            { Name: '日财卡(Japanese Credit Bureau Credit Card)', Value: 8, CardType: 'JC' },
            { Name: '美国运通卡(American Express)', Value: 1, CardType: 'AX' },
            { Name: '大莱卡(Diners Club)', Value: 5, CardType: 'DC' },
            { Name: '发现卡(Discover Card)', Value: 6, CardType: 'DS' },
            { Name: '环球航空旅行计划卡(Universal Air Travel Card)', Value: 10, CardType: 'TP' },
            { Name: '中国银联卡(China Union Pay Card)', Value: 0, CardType: 'UP' },
        ];
        HotelCardTypeList.map((item) => {
            if (item.CardType == cardType) {
                this.setState({
                    cardName: item
                })
            }
        })
    }

    _getCardNumber = (CardMessege) => {
        const { GuaranteeTypeArr, yilong, isUnionPay } = this.state
        let model = {
            Id: CardMessege.Id,
            EmployeeId: CardMessege.EmployeeId
        }
        GuaranteeTypeArr.forEach((item, index, arr) => {
            if (item === 'CA') {
                arr[index] = 'MC';
            } else if (item === 'CU') {
                arr[index] = 'UP';
            }
        });
        if (GuaranteeTypeArr.includes(CardMessege.CardType) || isUnionPay || yilong || !GuaranteeTypeArr.length) {
            this.showLoadingView();
            let CreditCardRaw = CardMessege.EmployeeId ? CommonService.HandShakeGetCreditCardRaw : CommonService.GetCreditCardRaw
            CreditCardRaw(model).then(response => {
                this.hideLoadingView();
                if (response && response.success && response.data) {
                    this._checkCard(response.data.CardNo, CardMessege);
                } else {
                    this.toastMsg(response.message);
                }
            }).catch(error => {
                this.toastMsg(error.message || '获取数据异常');
            })
        } else {
            this.toastMsg('维护的信用卡类型与酒店担保支持信用卡类型不符');
        }
    }

    _checkCard = (IdName, CardMessege) => {
        // const { yilong, isUnionPay} = this.state;
        // let elongBank = ['中国工商银行','中国银行','交通银行','兴业银行','招商银行','广东发展银行','中国民生银行','中信银行'];
        // if(isUnionPay||yilong){
        //     let model = {
        //         cardNo:IdName,
        //     }
        //     CommonService.validateAndCacheCardInfo(model).then(response => {//获取卡银行信息接口弃用
        //         if(response&&response.bank){
        //             ChinaBankList.map(item=>{
        //                 if(item.name==response.bank){
        //                     if(yilong){
        //                         if(elongBank.includes(item.value)){
        //                             CardMessege ? this._addData(CardMessege) : null
        //                             this.setState({
        //                                 bankStr:item.value,
        //                                 IdName:IdName
        //                             })
        //                         }else{
        //                             this.toastMsg('只接受发卡行（中信银行，中国银行，中国工商银行，中国民生银行，兴业银行，广发银行，招商银行，交通银行）的银联卡，请更换');
        //                             return;
        //                         } 
        //                     }else{
        //                         CardMessege ? this._addData(CardMessege) : null
        //                         this.setState({
        //                             bankStr:item.value,
        //                             IdName:IdName
        //                         })
        //                     }
        //                 }
        //             })
        //         }else{
        //             this.toastMsg('维护的信用卡类型与酒店担保支持信用卡类型不符');
        //             return;
        //         }
        //     }).catch(error => {
        //         this.hideLoadingView();
        //         this.toastMsg(error.message);
        //     })
        // }else{
        //     // this._cardChange(CardMessege.CardType);
        //     CardMessege ? this._addData(CardMessege) : null
        //     this.setState({
        //         IdName:IdName
        //     })
        // }
        CardMessege ? this._addData(CardMessege) : null
        this.setState({
            IdName: IdName
        })
    }

    _addData = (CardMessege) => {
        this._cardChange(CardMessege.CardType);
        let ExpireArr = CardMessege.Expire.split('/')
        let validYear = '20' + ExpireArr[1]
        this.setState({
            validYear: validYear,
            validMonth: ExpireArr[0],
        })
    }

    _clearCard = () => {
        this.setState({
            cardName: null,
            IdName: "",
            validYear: '',
            validMonth: '',
            Name: '',
            SeriNumber: '',
            Mobile: '',
            isTraveller:false,
            haveRead:false,
        });
    }

    renderBody() {
        const { IdName, validYear, validMonth, Name, SeriNumber, Type, options, cardName, Mobile, yilong, bankStr, isUnionPay } = this.state;
        let elongBank = ['中国工商银行', '中国银行', '交通银行', '兴业银行', '招商银行', '广东发展银行', '中国民生银行', '中信银行'];
        let reg = /^(.{4})(?:\d+)(.{4})$/
        // let _idName = IdName.replace(reg, "$1 **** **** $2")
        let yilongStr = '根据供应商担保需要，您稍后可能会收到信用卡担保验证码，请您收到验证码之后在酒店详情中提交验证码，未能及时提交可能会导致房间担保失败；'
        let yilongStr2 = '根据供应商要求，此房型担保只接受如下银行发行的银联卡：中信银行，中国银行，中国工商银行，中国民生银行，兴业银行，广发银行，招商银行和交通银行。'
        let alertStr = '请确保您提供的信用卡信息正确，如信用卡不符合要求，可能会导致房间担保失败；'
        
        let alertStr2 = '手工填写的信用卡不会被保存，您可在个人信用卡中维护；'
        let alertStr4 = '如勾选更新个人信用卡，则您输入的信用卡号将会被更新至您的个人信用卡。';
        let alertStr3 = '根据供应商要求，本房型担保证件类型仅支持身份证。'
        return (
            <View style={{ flex: 1 }}>
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {/* {
                            isUnionPay && <CustomText style={{ margin: 10, color: 'red' }} text='注意：请使用带有银联标记的信用卡' />
                        } */}
                    {(yilong) && <CustomText style={{ color: Theme.redColor, fontSize: 12, paddingHorizontal: 5, margin: 10 }} text={alertStr3} />}
                    <View style={{ borderTopWidth: 1, borderColor: Theme.lineColor, justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: Theme.yellowBg }}>
                        <Text>
                            <Text style={{ flexDirection: 'row', lineHeight: 18 }}>
                                <AntDesign name={'exclamationcircleo'} color={Theme.theme} backgroundColor={'yellow'} size={14} />
                                <CustomText text={' '} />
                                <CustomText text={'注意事项：'} style={{ fontSize: 12, color: Theme.theme, marginLeft: 2 }} />
                                <CustomText text={alertStr} style={{ fontSize: 12, color: Theme.theme }} />

                                <CustomText text={alertStr2} style={{ fontSize: 12, color: Theme.theme }} />
                                <CustomText text={alertStr4} style={{ fontSize: 12, color: Theme.RedMarkColor }} />

                            </Text>
                        </Text>
                        {(isUnionPay || yilong) && <CustomText style={{ color: Theme.orangeColor, fontSize: 12 }} text={yilongStr} />}
                        {(isUnionPay || yilong) && <CustomText style={{ color: Theme.orangeColor, fontSize: 12 }} text={yilongStr2} />}
                    </View>
                    <View style={{ margin: 10, backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 6 }}>
                        {
                            <TouchableOpacity style={styles.row}
                                onPress={() => {
                                    this.push('CreditCardScreen', {
                                        hotel: true,
                                        OtherBookingId: this.params.OtherBookingId,
                                        callBackCard: (CardMessege) => {
                                            if(CardMessege.EmployeeId && CardMessege.EmployeeId>0){
                                                this.state.isTraveller = true;
                                            }else{
                                                this.state.isTraveller = false;
                                            }
                                            let ExpireArr = CardMessege.Expire.split('/')
                                            let validYear = '20' + ExpireArr[1]
                                            this._getCardNumber(CardMessege);
                                        }
                                    })
                                }
                                }
                            >
                                <View style={{
                                    flex: 3,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                    <CustomText text='查找个人信用卡' />
                                </View>
                                <View style={styles.right}>
                                    <CustomText text={''} style={{ flex: 1 }} />
                                    <Ionicons name={'ios-arrow-forward'} size={20} color={'lightgray'} />
                                </View>
                            </TouchableOpacity>
                        }
                        {isUnionPay ? null : <View style={styles.row}>
                            <View style={{
                                flex: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <CustomText text='信用卡类型' />
                                <CustomText text='*' style={{ color: Theme.theme }} />
                            </View>

                            <View style={styles.right}>
                                <CustomText text={cardName && cardName.Name} style={{ flex: 1 , color: !this.state.isTraveller ? 'black' : Theme.promptFontColor }} onPress={this._selectCard} />
                                <Ionicons name={'ios-arrow-forward'} size={20} color={'lightgray'} />
                            </View>
                        </View>
                        }

                        <View style={styles.row}>
                            <View style={{
                                flex: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <CustomText text='信用卡卡号' />
                                <CustomText text='*' style={{ color: Theme.theme }} />
                            </View>
                            <CustomeTextInput placeholder='请输入信用卡卡号' style={{ flex: 7 }}
                                value={IdName}
                                onFocus={() => {
                                }}
                                onBlur={() => { this._checkCard(IdName) }}
                                onChangeText={text => this.setState({ IdName: text })}
                                editable={!this.state.isTraveller}
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={{
                                flex: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <CustomText text='有效年份' />
                                <CustomText text='*' style={{ color: Theme.theme }} />
                            </View>
                            <CustomText  text={this.state.validYear ? this.state.validYear : '有效年份,如2020'} style={{ flex: 7, color: validYear && !this.state.isTraveller ? 'black' : Theme.promptFontColor, fontSize: 14 }} onPress={this.pickerYear} />
                        </View>
                        <View style={styles.row}>
                            <View style={{
                                flex: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <CustomText text='有效月份' />
                                <CustomText text='*' style={{ color: Theme.theme }} />
                            </View>
                            <CustomText text={this.state.validMonth ? this.state.validMonth : '有效月份,如06'} style={{ flex: 7, color: validMonth && !this.state.isTraveller ? 'black' : Theme.promptFontColor, fontSize: 14 }} onPress={this.pickerMonth} />
                        </View>
                        {(yilong) &&
                            <View style={styles.row}>
                                <View style={{
                                    flex: 3,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                    <CustomText text='证件类型' />
                                    {(yilong) && <CustomText text='*' style={{ color: Theme.theme }} />}
                                </View>
                                <View style={styles.right}>
                                    <CustomText text={Type} style={{ flex: 1 }} onPress={this._selectType} />
                                    <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                                </View>
                            </View>
                        }
                        <View style={styles.row}>
                            <View style={{
                                flex: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <CustomText text='持卡人姓名' />
                                <CustomText text='*' style={{ color: Theme.theme }} />
                            </View>
                            <CustomeTextInput placeholder='请输入持卡人姓名' style={{ flex: 7 }} value={Name} onChangeText={text => this.setState({ Name: text })} />
                        </View>
                        {yilong && <View style={styles.row}>
                            <View style={{
                                flex: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <CustomText text='持卡人证件号' />
                                {yilong && <CustomText text='*' style={{ color: Theme.theme }} />}
                            </View>
                            {/* <CustomText text='持卡人证件号' style={{ flex: 3 }} /> */}
                            <CustomeTextInput placeholder='请输入证件号码' style={{ flex: 7 }} value={SeriNumber} onChangeText={text => this.setState({ SeriNumber: text })} />
                        </View>
                        }
                        {yilong && <View style={styles.row}>
                            <View style={{
                                flex: 3,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <CustomText text='手机号' />
                                {yilong && <CustomText text='*' style={{ color: Theme.theme }} />}
                            </View>
                            {/* <CustomText text='持卡人证件号' style={{ flex: 3 }} /> */}
                            <CustomeTextInput placeholder='请输入手机号' style={{ flex: 7 }} value={Mobile} onChangeText={text => this.setState({ Mobile: text })} />

                        </View>
                        }
                        
                    </View>
                    {
                            <View style={{display:'flex',flexDirection: 'row',justifyContent:'space-between',fontSize: 13,color: Theme.commonFontColor }}>
                                <TouchableHighlight style={{ height: 30,width:120 }} underlayColor='transparent' onPress={() => {
                                    //提示不可保存信用卡
                                    if(!this.state.isTraveller){
                                        this.setState({
                                            haveRead: !this.state.haveRead
                                        });

                                    }else{
                                        this.toastMsg('非本人信用卡');
                                    }
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                                        <MaterialIcons
                                            name={this.state.haveRead ? 'check-box' : 'check-box-outline-blank'}
                                            size={18}
                                            color={Theme.promptFontColor}
                                        />
                                        <CustomText allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 13, marginLeft: 5 }} text='更新个人信用卡' />
                                    </View>
                                </TouchableHighlight>
                                <CustomText text='清空' style={{height:30,window:50,right:10}} onPress={this._clearCard} />
                            </View>
                    }


                    <CustomActioSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />

                </KeyboardAwareScrollView>
                {
                    ViewUtil.getThemeButton('提交', this._submitButton)
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    row: {
        height: 50,
        paddingHorizontal: 10,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        alignItems: 'center',
        flexDirection: 'row',
    },
    right: {
        flex: 7,
        alignItems: 'center',
        flexDirection: 'row',
    }
})