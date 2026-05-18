import React, {PureComponent} from 'react';
import {
    TouchableOpacity
} from "react-native"
import PropTypes from 'prop-types'
import throttle from 'lodash.throttle';

export default class Touchable extends PureComponent {

    constructor(props){
        super(props)
        this.handleClickThrottled = throttle(this.props.onPress, this.props.onPressWithSecond);
    }
    componentWillUnmount() {
        this.handleClickThrottled.cancel();
    }

    render() {
        return (
            <TouchableOpacity {...this.props} onPress={this.handleClickThrottled}>
                {this.props.children}
            </TouchableOpacity>
        );
    }
}

Touchable.propTypes = {
    onPressWithSecond: PropTypes.number, // 几秒钟可以点击一次
}

Touchable.defaultProps = {
    onPressWithSecond: 1000
}
