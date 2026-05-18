import React from 'react';
import {
    View,
    FlatList,
    DeviceEventEmitter,
    InteractionManager
} from 'react-native';
import SuperView from '../../super/SuperView';
import SearchInput from '../../custom/SearchInput';
import ViewUtil from '../../util/ViewUtil';
import UserInfoDao from '../../service/UserInfoDao';
import OrderListItem from './OrderListItem';
import InflFlightService from '../../service/InflFlightService';
import IntlFlightEnum from '../../enum/IntlFlightEnum';
import NavigationUtils from '../../navigator/NavigationUtils';
import { connect } from 'react-redux';
class IntlFlightOrderListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '订单列表'
        }
        this._tabBarBottomView = {
            bottomInset: true,
        }
        this.state = {
            page: 1,
            isLoading: true,
            dataList: [],
            isLoadingMore: false,
            isNoMoreData: false,
            userInfo: null,
            customerInfo: null,
            keyword: "",
            titleStatus: 1
        }
    }

    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: false
        }
    }
    _backBtnClick = () => {
        if (!this.params.backtoMy) {
            NavigationUtils.popToTop(this.props.navigation);
            InteractionManager.runAfterInteractions(() => {
                DeviceEventEmitter.emit('deleteApply', {});
            });
        } else {
            NavigationUtils.pop(this.props.navigation);
        }
        return true;
    }


    componentDidMount() {
        UserInfoDao.getUserInfo().then(userInfo => {
            UserInfoDao.getCustomerInfo().then(customerInfo => {
                this.setState({
                    userInfo,
                    customerInfo
                }, () => {
                    this._loadList();
                })
            }).catch(error => {
                this.toastMsg(error.message || '获取数据异常');
            })
        }).catch(error => {
            this.toastMsg(error.message || '获取数据异常');
        })
        this.backFromShopListener = DeviceEventEmitter.addListener(
            'IntlFlightOrderListChange',  //监听器名
            () => {
                this.setState({
                    page: 1,
                    isLoading: true,
                    isNoMoreData: false,
                    isLoadingMore: false,
                    dataList: []
                }, () => {
                    this._loadList();
                })
            },
        );
    }
    componentWillUnmount() {
        this.backFromShopListener && this.backFromShopListener.remove();
    }

    _loadList = () => {
        const { keyword, page, userInfo } = this.state;
        if (!userInfo) return;
       
        const model = {
            Pagination: {
                PageIndex: page,
                PageSize: 20
            },
            Query: {
                KeyWord: keyword,
                EmployeeId: userInfo.Id,
                CustomerId: userInfo.Customer && userInfo.Customer.Id,
            }
        }
        if(keyword.length > 0){
            this.showLoadingView();
        }

        InflFlightService.orderList(model).then(response => {
            this.hideLoadingView();
            if (response) {
                response.ListData.forEach((resultItem) => {
                    resultItem.DepartureEname = resultItem.Departure;
                    resultItem.DestinationEname = resultItem.Destination;
                    if (resultItem.AirportCities && Array.isArray(resultItem.AirportCities)) {
                        resultItem.AirportCities.forEach((item, index) => {
                            if (resultItem.Departure === item.CityName) {
                                resultItem.DepartureEname = item.CityEnName;
                            }
                            if (resultItem.Destination === item.CityName) {
                                resultItem.DestinationEname = item.CityEnName;
                            }
                        })
                    }
                    // resultItem.Amount += resultItem.ServiceCharge;
                    this.state.dataList.push(resultItem);
                })
            }
            if (response.TotalRecorder <= this.state.dataList.length) {
                this.state.isNoMoreData = true;
            }
            this.setState({
                isLoading: false,
                isLoadingMore: false
            })
        }).catch(error => {
            this.hideLoadingView();
            this._detailError();
            this.toastMsg(error.message);
        })
    }

    /**
     *  请求错误处理
     */
    _detailError = () => {
        if (this.state.isLoadingMore) {
            this.state.page--;
        }
        this.setState({
            isLoading: false,
            isNoMoreData: false
        })
    }

    _searchOrder = () => {
        this.setState({
            page: 1,
            dataList: [],
            isLoading: true,
            isLoadingMore: false,
            isNoMoreData: false,
            dataList: []
        }, () => {
            this._loadList();
        })
    }
    /**
     * 催审
     */
    _prompt = (item) => {
        let remindModel = {
            OrderId: item.Id
        };
        this.showLoadingView();
        InflFlightService.orderRemind(remindModel).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.toastMsg('催审订单成功');
            } else {
                this.toastMsg(response.message || '催审订单失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '催审订单异常');
        });
    }
    /**
     * 取消
     */
    _cancel = (item) => {
        this.showAlertView('确定取消该订单么？', () => {
            return ViewUtil.getAlertButton('取消', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                this.showLoadingView();
                InflFlightService.orderCancel({ OrderId: item.Id }).then(response => {
                    this.hideLoadingView();
                    if (response && response.success) {
                        item.Status = IntlFlightEnum.orderStatus.Canceled;
                        item.StatusDesc = '已取消';
                        this.setState({});
                        this.toastMsg('取消订单成功');
                    } else {
                        this.toastMsg(response.message || '取消订单失败');
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message || '取消订单异常');
                })
            })
        })
    }
    _renderItem = ({ item, index }) => {
        return <OrderListItem order={item} 
                              prompt={this._prompt.bind(this, item)} 
                              cancel={this._cancel.bind(this, item)} 
                              comp_userInfo = {this.props.comp_userInfo}
                              userInfoId = {this.state.userInfo.Id}
                              otwThis = {this}
                />
    }
    renderBody() {
        const { dataList, isLoading, isLoadingMore, isNoMoreData, keyword } = this.state;
        return (
            <View style={{ flex: 1 }}>
                <SearchInput placeholder='乘客姓名/订单号' onSubmitEditing={this._searchOrder} value={keyword} onChangeText={text => this.setState({ keyword: text })} />
                <FlatList
                    data={dataList}
                    renderItem={this._renderItem}
                    showsVerticalScrollIndicator={false}
                    refreshControl={ViewUtil.getRefreshControl(isLoading, () => {
                        this.setState({
                            page: 1,
                            isLoading: true,
                            isNoMoreData: false,
                            isLoadingMore: false,
                            dataList: []
                        }, () => {
                            this._loadList();
                        })
                    })}
                    keyExtractor={(item, index) => String(index)}
                    onEndReachedThreshold={0.1}
                    ListFooterComponent={ViewUtil.getRenderFooter(isLoadingMore, isNoMoreData)}
                    onEndReached={() => {
                        setTimeout(() => {
                            if (this.canLoad && !isNoMoreData && !isLoadingMore && !isLoading) {
                                this.state.page++;
                                this.setState({
                                    isLoadingMore: true
                                }, () => {
                                    this._loadList();
                                    this.canLoad = false;
                                })
                            }
                        }, 100)
                    }}
                    onMomentumScrollBegin={() => {
                        this.canLoad = true
                    }}
                />
            </View>
        )
    }
}

const getStatePorps = state => ({
    comp_userInfo: state.comp_userInfo,
})
export default connect(getStatePorps)(IntlFlightOrderListScreen);