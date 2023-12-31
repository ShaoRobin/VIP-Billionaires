import React, {useState, useEffect} from 'react';
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  // StatusBar
} from 'react-native';
import {connect} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import ImagePicker from 'react-native-image-crop-picker';
import Feather from 'react-native-vector-icons/Feather';
import {chunk, isEmpty} from 'lodash';

import {
  COLOR_BTN_BACKGROUND,
  COLOR_GRAY_DARK,
  themes,
} from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
// import SafeAreaView from 'react-native-safe-area-context'
import {withTheme} from '../../theme';
import images from '../../assets/images';
import styles from './styles';
import {setUser as setUserAction} from '../../actions/login';
import ActivityIndicator from '../../containers/ActivityIndicator';
import firebaseSdk, {
  DB_ACTION_DELETE,
  DB_ACTION_UPDATE,
  NOTIFICATION_TYPE_LIKE,
} from '../../lib/firebaseSdk';
import {showErrorAlert, showToast} from '../../lib/info';
import {VectorIcon} from '../../containers/VectorIcon';
import I18n from '../../i18n';
import {
  checkCameraPermission,
  checkPhotosPermission,
  backImagePickerConfig,
} from '../../utils/permissions';
import {isValidURL} from '../../utils/validators';
import {withActionSheet} from '../../containers/ActionSheet';
import {POST_TYPE_PHOTO, POST_TYPE_VIDEO} from '../../constants/app';
import {onSharePost} from '../../utils/const';
import Post from '../HomeView/Post';

const ProfileView = props => {
  const {navigation, user, theme} = props;
  const [state, setState] = useState({
    account: {
      userId: user.userId,
    },
    posts: [],
    isLoading: true,
    updating: false,
    refreshing: false,
  });
  const [isPostTab, setIsPostTab] = useState(true);

  const {account, posts, isLoading} = state;

  let unSubscribePost = '';

  useEffect(() => {
    const {navigation} = props;
    navigation.setOptions({
      header: () => (
        <View style={styles.headerView}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIcon}>
            <VectorIcon
              name={'left'}
              size={16}
              color={COLOR_GRAY_DARK}
              type={'AntDesign'}
              style={{marginTop: 8, marginLeft: 8}}/>
          </TouchableOpacity>
          <Text style={[styles.headerText, {color: themes[theme].deactiveTintColor}]}>
            {I18n.t('AppTitle')}
          </Text>
        </View>
      ),
      title: null,
      headerStyle: {
        backgroundColor: themes[theme].backgroundColor,
        shadowOpacity: 0,
      },
    });
  }, [theme]);

  useEffect(() => {
    if (!isEmpty(user)) init();
  }, [user]);

  const setSafeState = states => {
    setState({...state, ...states});
  };

  const init = () => {
    const {navigation} = props;
    firebaseSdk
      .getUser(state.account.userId)
      .then(user => {
        const userPostSubscribe = firestore()
          .collection(firebaseSdk.TBL_POST)
          .where('userId', '==', state.account.userId);
        unSubscribePost = userPostSubscribe.onSnapshot(querySnap => {
          let posts = [];
          if (querySnap) {
            querySnap.forEach(doc => {
              posts.push({id: doc.id, ...doc.data(), owner: user});
            });
            posts.sort((a, b) => b.date - a.date);
            setSafeState({account: user, isLoading: false, posts});
          }
        });
      })
      .catch(err => {
        setSafeState({isLoading: false});
        showErrorAlert(I18n.t('user_not_found'), '', () => navigation.pop());
      });
  };

  const goToFollowers = () => {
    navigation.push('Follow', {
      type: 'followers',
      account: state.account,
    });
  };

  const goToFollowings = () => {
    navigation.push('Follow', {
      type: 'followings',
      account: state.account,
    });
  };

  const goToPosts = () => {
    // navigation.navigate('Posts', {
    //   type: 'posts',
    //   account: state.account,
    // });
    props.navigation.push('Home');
  };

  const onOpenPost = item => {
    props.navigation.push('PostDetail', {post: item});
  };

  const onToggleLike = (item, isLiking) => {
    const {user} = props;

    let update = {};
    if (isLiking) {
      update = {id: item.id, likes: item.likes.filter(l => l !== user.userId)};
    } else {
      update = {id: item.id, likes: [...item.likes, user.userId]};
    }

    setState({...state, isLoading: true});
    firebaseSdk
      .setData(firebaseSdk.TBL_POST, DB_ACTION_UPDATE, update)
      .then(() => {
        if (!isLiking && item.owner.userId !== user.userId) {
          const postImage =
            item.type === 'video'
              ? item?.thumbnail
              : item.type === 'photo'
              ? item?.photo
              : '';
          const activity = {
            type: NOTIFICATION_TYPE_LIKE,
            sender: user.userId,
            receiver: item.owner.userId,
            content: '',
            text: item.text,
            postId: item.id,
            postImage,
            postType: item.type,
            title: item.owner.displayName,
            message: `${user.displayName} ${I18n('likes_your_post')}.`,
            date: new Date(),
          };
          firebaseSdk.addActivity(activity, item.owner.token).then(r => {});
        }
      })
      .catch(() => {
        setState({...state, isLoading: false});
      });
  };

  const openLink = url => {
    if (url && url.length > 0 && isValidURL(url)) {
      Linking.openURL(url);
    }
  };

  const takePhoto = async () => {
    if (await checkCameraPermission()) {
      ImagePicker.openCamera(backImagePickerConfig).then(image => {
        onUpdateUser(image.path);
      });
    }
  };

  const chooseFromLibrary = async () => {
    if (await checkPhotosPermission()) {
      ImagePicker.openPicker(backImagePickerConfig).then(image => {
        onUpdateUser(image.path);
      });
    }
  };

  const onUpdateUser = image_path => {
    const {user, setUser} = props;
    setState({...state, isLoading: true});
    if (image_path) {
      firebaseSdk
        .uploadMedia(firebaseSdk.STORAGE_TYPE_AVATAR, image_path)
        .then(image_url => {
          let userInfo = {
            id: user.id,
            avatar: image_url,
          };

          firebaseSdk
            .setData(firebaseSdk.TBL_USER, DB_ACTION_UPDATE, userInfo)
            .then(() => {
              setState({...state, isLoading: false});
              const updateUser = {...user, ...userInfo};
              setUser(updateUser);

              init();
            })
            .catch(err => {
              showToast(I18n.t(err.message));
              setState({...state, isLoading: false});
            });
        })
        .catch(err => {
          showErrorAlert(err, I18n.t('Oops'));
          setState({...state, isLoading: false});
        });
    }
  };

  const onEditBackImage = () => {
    Alert.alert('', I18n.t('Upload_photo'), [
      {
        text: I18n.t('Cancel'),
        onPress: () => {},
      },
      {
        text: I18n.t('Take_a_photo'),
        onPress: () => {
          takePhoto();
        },
      },
      {
        text: I18n.t('Choose_a_photo'),
        onPress: () => {
          chooseFromLibrary();
        },
      },
    ]);
  };

  if (!user) {
    return null;
  }

  const onActionPost = item => {
    const onEdit = () => {
      navigation.push('EditPost', {postId: item.id});
    };

    const onRemove = () => {
      setState({...state, isUpdating: true});
      firebaseSdk
        .setData(firebaseSdk.TBL_POST, DB_ACTION_DELETE, {id: item.id})
        .then(() => {
          showToast(I18n.t('Remove_post_complete'));
          setState({...state, isUpdating: false});
        })
        .catch(err => {
          showErrorAlert(I18n.t('Remove_post_failed'), I18n.t('Oops'));
          setState({...state, isUpdating: false});
        });
    };

    const ownerOptions = [
      {
        title: I18n.t('edit_post'),
        onPress: onEdit,
      },
      {
        title: I18n.t('Remove'),
        // danger: true,
        onPress: onRemove,
      },
    ];
    return {options: ownerOptions};
  };

  const toggleAction = () => {
    Alert.alert('', I18n.t('Upload_profile_photo'), [
      {
        text: I18n.t('Cancel'),
        onPress: () => {},
      },
      {
        text: I18n.t('Take_a_photo'),
        onPress: () => {
          takePhoto();
        },
      },
      {
        text: I18n.t('Choose_a_photo'),
        onPress: () => {
          chooseFromLibrary();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar/>
      <ScrollView contentContainerStyle={{paddingBottom: 80}}>
        <View style={styles.logoContainer}>
          <TouchableOpacity
            onPress={() => onEditBackImage()}
            style={styles.backAction}>
            {/* <VectorIcon
              name={'camera-alt'}
              size={24}
              color={'white'}
              type={'MaterialIcons'}
            /> */}
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.mainContent,
            {backgroundColor: themes[theme].backgroundColor},
          ]}>
          <View
            style={[
              styles.avatarContainer,
              {backgroundColor: themes[theme].backgroundColor},
            ]}>
            <Image
              source={
                account.avatar ? {uri: account.avatar} : images.default_avatar
              }
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={toggleAction}>
              <VectorIcon
                type={'MaterialIcons'}
                name={'add'}
                size={16}
                color={'white'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.mainInfo}>
            <View style={styles.profileInfo}>
              <Text
                style={[
                  styles.profileName,
                  {color: themes[theme].activeTintColor},
                ]}>
                {/* {getUserRepresentString(account)} */}
                {account.displayName}
              </Text>
              {(account.company && account.company.length > 0) ||
              (account.role && account.role.length > 0) ? (
                <Text
                  style={[
                    styles.job,
                    {
                      color: themes[theme].textColor,
                    },
                  ]}>
                  {account.company + ' ' + account.role}
                </Text>
              ) : null}
              {account.bio && account.bio.length > 0 ? (
                <Text
                  style={{
                    ...styles.bio,
                    ...{color: themes[theme].normalTextColor},
                  }}>
                  {account.bio}
                </Text>
              ) : null}
              {account.website && account.website.length > 0 ? (
                <TouchableOpacity
                  style={styles.website}
                  onPress={() => openLink(account.website)}>
                  <Text
                    style={[
                      styles.website,
                      {color: themes[theme].websiteLink},
                    ]}>
                    {account.website}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileEdit')}
                style={[
                  styles.editProfileTxtBtn,
                  {backgroundColor: COLOR_BTN_BACKGROUND},
                ]}>
                <Text
                  style={[
                    styles.editProfileTxt,
                    {color: themes[theme].normalTextColor},
                  ]}>
                  {I18n.t('Edit_profile')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={[
              styles.followWrap,
              {borderColor: themes[theme].deactiveTintColor},
            ]}>
            <TouchableOpacity
              onPress={() => goToPosts()}
              style={[
                styles.optionContainer,
                {
                  borderRightWidth: 1,
                  borderRightColor: themes[theme].borderColor,
                },
              ]}>
              <Text
                style={[
                  styles.optionValue,
                  {color: themes[theme].activeTintColor},
                ]}>
                {posts.length ?? 0}
              </Text>
              <Text
                style={[
                  styles.optionTitle,
                  {color: themes[theme].deactiveTintColor},
                ]}>
                {I18n.t('Posts')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => goToFollowings()}
              style={[
                styles.optionContainer,
                {
                  borderRightWidth: 1,
                  borderRightColor: themes[theme].borderColor,
                },
              ]}>
              <Text
                style={[
                  styles.optionValue,
                  {color: themes[theme].activeTintColor},
                ]}>
                {account.followings?.length ?? 0}
              </Text>
              <Text
                style={[
                  styles.optionTitle,
                  {color: themes[theme].deactiveTintColor},
                ]}>
                {I18n.t('Followings')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => goToFollowers()}
              style={styles.optionContainer}>
              <Text
                style={[
                  styles.optionValue,
                  {color: themes[theme].activeTintColor},
                ]}>
                {account.followers?.length ?? 0}
              </Text>
              <Text
                style={[
                  styles.optionTitle,
                  {color: themes[theme].deactiveTintColor},
                ]}>
                {I18n.t('Followers')}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tabContainer}>
            <View
              style={[
                styles.tab,
                {backgroundColor: themes[theme].disableButtonBackground},
              ]}>
              <TouchableOpacity
                onPress={() => setIsPostTab(true)}
                style={[
                  styles.tabItem,
                  {
                    backgroundColor: isPostTab
                      ? COLOR_BTN_BACKGROUND
                      : themes[theme].disableButtonBackground,
                  },
                ]}>
                <Text
                  style={[
                    styles.tabItemText,
                    {
                      color: isPostTab
                        ? themes[theme].normalTextColor
                        : themes[theme].subTextColor,
                    },
                  ]}>
                  {I18n.t('Posts')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsPostTab(false)}
                style={[
                  styles.tabItem,
                  {
                    backgroundColor: !isPostTab
                      ? COLOR_BTN_BACKGROUND
                      : themes[theme].disableButtonBackground,
                  },
                ]}>
                <Text
                  style={[
                    styles.tabItemText,
                    {
                      color: !isPostTab
                        ? themes[theme].normalTextColor
                        : themes[theme].subTextColor,
                    },
                  ]}>
                  {I18n.t('media')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {isPostTab ? (
            posts.map((item, index) => (
              <Post
                key={index}
                item={item}
                onPress={() => onOpenPost(item)}
                onPressUser={() => {}}
                onPressShare={() => onSharePost(item)}
                onLike={isLiking => onToggleLike(item, isLiking)}
                isLiking={item.likes && item.likes.includes(user.userId)}
                onActions={onActionPost(item)}
                theme={theme}
                style={{marginTop: index === 0 ? 0 : 8}}
              />
            ))
          ) : (
            <View style={{paddingHorizontal: 11}}>
              {chunk(
                posts.filter(
                  p => p.type === POST_TYPE_PHOTO || p.type === POST_TYPE_VIDEO,
                ),
                3,
              ).map((p, index) => {
                if (index % 4 === 0) {
                  return (
                    <View style={{flexDirection: 'row'}} key={index}>
                      <TouchableOpacity onPress={() => onOpenPost(p[0])}>
                        <Image
                          source={{uri: Array.isArray(p[0]?.photo) ? p[0]?.photo[0] : p[0]?.photo || p[0]?.thumbnail}}
                          style={[styles.tile1]}
                        />
                      </TouchableOpacity>
                      <View>
                        <TouchableOpacity onPress={() => onOpenPost(p[1])}>
                          <Image
                            source={{uri: Array.isArray(p[1]?.photo) ? p[1]?.photo[0] : p[1]?.photo || p[1]?.thumbnail}}
                            style={[styles.tile2]}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onOpenPost(p[2])}>
                          <Image
                            source={{uri: Array.isArray(p[2]?.photo) ? p[2]?.photo[0] : p[2]?.photo || p[2]?.thumbnail}}
                            style={styles.tile2}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }
                if (index % 4 === 1 || index % 4 === 3) {
                  return (
                    <View style={{flexDirection: 'row'}} key={index}>
                      <TouchableOpacity onPress={() => onOpenPost(p[0])}>
                        <Image
                          source={{uri: Array.isArray(p[0]?.photo) ? p[0]?.photo[0] : p[0]?.photo || p[0]?.thumbnail}}
                          style={styles.tile3}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onOpenPost(p[1])}>
                        <Image
                          source={{uri: Array.isArray(p[1]?.photo) ? p[1]?.photo[0] : p[1]?.photo || p[1]?.thumbnail}}
                          style={styles.tile3}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onOpenPost(p[2])}>
                        <Image
                          source={{uri: Array.isArray(p[2]?.photo) ? p[2]?.photo[0] : p[2]?.photo || p[2]?.thumbnail}}
                          style={styles.tile3}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }
                if (index % 4 === 2) {
                  return (
                    <View style={{flexDirection: 'row'}} key={index}>
                      <View>
                        <TouchableOpacity onPress={() => onOpenPost(p[0])}>
                          <Image
                            source={{uri: Array.isArray(p[0]?.photo) ? p[0]?.photo[0] : p[0]?.photo || p[0]?.thumbnail}}
                            style={styles.tile2}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onOpenPost(p[1])}>
                          <Image
                            source={{uri: Array.isArray(p[1]?.photo) ? p[1]?.photo[0] : p[1]?.photo || p[1]?.thumbnail}}
                            style={styles.tile2}
                          />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => onOpenPost(p[2])}>
                        <Image
                          source={{uri: Array.isArray(p[2]?.photo) ? p[2]?.photo[0] : p[2]?.photo || p[2]?.thumbnail}}
                          style={styles.tile1}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }
              })}
            </View>
          )}
        </View>
      </ScrollView>
      {isLoading ? (
        <ActivityIndicator absolute size="large" theme={theme} />
      ) : null}
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  user: state.login.user,
});

const mapDispatchToProps = dispatch => ({
  setUser: params => dispatch(setUserAction(params)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withActionSheet(withTheme(ProfileView)));
