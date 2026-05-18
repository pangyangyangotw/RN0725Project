import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    TouchableHighlight
} from 'react-native';
import SuperView from '../../super/SuperView';
import SearchInput from '../../custom/SearchInput';
import ViewUtil from '../../util/ViewUtil';
import CustomText from '../../custom/CustomText';
import I18nUtil from '../../util/I18nUtil';
import FlightService from '../../service/FlightService';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
export default class InvoiceListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            //  title: this.params.title,
            title: '选择发票抬头',
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.state = {
            keyWord: '',
            page: '',
            projectList: [],
            isNoMoreData: false,
            isLoading: true,
            isLoadingMore: false,
            page: 1,
        }
    }
    componentDidMount() {
        this._reloadProjectList();
    }
    _reloadProjectList = () => {
        let model = {
            Key:this.state.keyWord,
            CustomerId:this.params.CustomerId,
            pagination: {
                PageIndex: this.state.page,
                PageSize: 10
            }
        }
        FlightService.GetElectronicItineraryHeader(model).then(response => {
            if (response && response.success && response.data && response.data.Data) {
                this.state.projectList = this.state.projectList.concat(response.data.Data);
                if (response.data.PgPagination.TotalItem <= this.state.projectList.length) {
                    this.state.isNoMoreData = true;
                }
                this.setState({
                    isLoading: false,
                    isLoadingMore: false
                })
            } else {
                this._detailLoadFail();
                this.toastMsg(response.message || '加载数据失败请重试');
            }
        }).catch(error => {
            this._detailLoadFail();
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }


    _detailLoadFail = () => {
        if (this.state.isLoadingMore) {
            this.state.page--;
        }
        this.setState({
            isLoading: false,
            isLoadingMore: false
        })
    }
    _submitEditing = () => {
        this.setState({
            isLoading: true,
            isNoMoreData: false,
            isLoadingMore: false,
            projectList: [],
            page: 1
        }, () => {
            this._reloadProjectList();
        })
    }

    _backOrderClick = (item) => {
        this.params.InvoicecallBack(item);
        this.pop();
    }
    _renderItem = ({ item, index }) => {
        return (
            <TouchableHighlight underlayColor='transparent' onPress={this._backOrderClick.bind(this, item)} style={{ marginHorizontal: 10, marginTop:10 }}>
                <View style={styles.row}>
                    <View style={{flexWrap:'wrap'}}>
                        <CustomText  text={item.BuyerName}  style={{ color:Theme.fontColor }} />
                        {item.BuyerNameEn ? <CustomText  text={item.BuyerNameEn}  style={{ color:Theme.assistFontColor }} /> : null}
                    </View>
                    <View style={{flexDirection:'row',flexWrap:'wrap',paddingVertical:6}}>
                        <CustomText text={item.BuyerTypeDesc} style={{ color:Theme.commonFontColor }} />
                    </View>
                    <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                        <CustomText text={item.BuyerTaxPayerId} style={{ color:Theme.commonFontColor }}  />
                    </View>
                </View>
            </TouchableHighlight>
        )
    }

    _renderFooter = () => {
        const { isLoading, isLoadingMore, isNoMoreData, projectList } = this.state;
        return ViewUtil.getRenderFooter(isLoadingMore, isNoMoreData, !isLoading && projectList.length === 0);
    }
    renderBody() {
        const { keyWord, projectList, isLoading, isNoMoreData } = this.state;
        let placeholder = '输入名称';
        return (
            <View style={{ flex: 1 }}>
                <SearchInput placeholder={placeholder} value={keyWord} onChangeText={(text) => this.setState({ keyWord: text })} onSubmitEditing={this._submitEditing} />
                <FlatList
                    data={projectList}
                    renderItem={this._renderItem}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => String(index)}
                    onEndReachedThreshold={0.1}
                    onEndReached={() => {
                        setTimeout(() => {
                            if (this.canLoadMore && !isNoMoreData) {
                                this.setState({
                                    isLoadingMore: true,
                                    page: ++this.state.page
                                }, () => {
                                    this._reloadProjectList();
                                    this.canLoadMore = false;
                                })
                            }
                        }, 100);
                    }}
                    refreshControl={ViewUtil.getRefreshControl(isLoading, () => {
                        this.setState({
                            page: 1,
                            isNoMoreData: false,
                            isLoadingMore: false,
                            projectList: [],
                        }, () => {
                            this._reloadProjectList();
                        })
                    })}
                    ListFooterComponent={this._renderFooter}
                    onMomentumScrollBegin={() => {
                        this.canLoadMore = true;
                    }}
                />
            </View>
        )
    }
}
const styles = StyleSheet.create({
    row: {
        backgroundColor: 'white',
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        padding: 10,
        borderRadius:5
    }
})