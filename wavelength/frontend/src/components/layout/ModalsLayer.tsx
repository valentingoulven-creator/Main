/**
 * ModalsLayer — renders all modals/overlays at the root level.
 * All logic is passed as props from App.tsx.
 */
import type { UserProfile, Track, NearbyUser, ChatConversation, IncomingChatRequest, Rating, PublicLive, YTSession, ChatStatus } from '../../types';
import type { BlockedUser } from '../../utils/profileStorage';
import type { Session } from '../../utils/auth';
import type { MapStyleDef } from '../MapStyleBar';
import type { LiveVisibility } from '../LiveSetupModal';

import TrackInput from '../TrackInput';
import ProfileModal from '../ProfileModal';
import ProfileEditor from '../ProfileEditor';
import RatingPicker from '../RatingPicker';
import ChatWindow from '../ChatWindow';
import ChatNotification from '../ChatNotification';
import GpsPicker from '../GpsPicker';
import CameraCapture from '../CameraCapture';
import { DonateUser, DonateApp } from '../DonateModal';
import LiveBroadcast from '../LiveBroadcast';
import LiveSetupModal from '../LiveSetupModal';
import LiveViewer from '../LiveViewer';
import SpotifyConnect from '../SpotifyConnect';
import YouTubeConnect from '../YouTubeConnect';
import SettingsPanel from '../SettingsPanel';
import { YouTubeSessionSetup, YouTubeSessionHost, YouTubeSessionViewer } from '../YouTubeSession';

interface Props {
  // Profile
  profile: UserProfile;
  session: Session | null;
  myTrack: Track | null;
  myJamUrl: string;
  chatStatus: ChatStatus;

  // Visibility flags
  showTrackInput: boolean;
  showProfileEditor: boolean;
  showGpsPicker: boolean;
  showCamera: boolean;
  showSpotifyConnect: boolean;
  showYouTubeConnect: boolean;
  showDonateApp: boolean;
  showSettings: boolean;
  showMapPicker?: boolean;

  // Ratings
  ratingTarget: NearbyUser | null;
  ratingsCache: Record<string, Rating[]>;
  myRatings: Record<string, string>;

  // Chat
  conversations: Map<string, ChatConversation>;
  incomingRequest: IncomingChatRequest | null;

  // Live
  showLiveSetup: boolean;
  showLiveBroadcast: boolean;
  liveSetupData: { title: string; visibility: LiveVisibility } | null;
  watchingLive: NearbyUser | PublicLive | null;
  amLive: boolean;
  liveViewers: number;

  // YouTube session
  showYTSetup: boolean;
  myYTSession: YTSession | null;
  joiningYT: { host: NearbyUser; session: YTSession } | null;

  // Blocked
  blockedUsers: BlockedUser[];

  // Misc
  donateTarget: NearbyUser | null;
  viewedProfile: NearbyUser | null;
  mapStyle?: MapStyleDef;

  // Handlers — close
  onCloseTrackInput: () => void;
  onCloseProfileEditor: () => void;
  onCloseGpsPicker: () => void;
  onCloseCamera: () => void;
  onCloseSpotify: () => void;
  onCloseYouTube: () => void;
  onCloseDonateApp: () => void;
  onCloseSettings: () => void;
  onCloseRating: () => void;
  onCloseViewedProfile: () => void;
  onCloseDonateUser: () => void;
  onCloseLiveSetup: () => void;
  onCloseLiveBroadcast: () => void;
  onCloseWatchingLive: () => void;
  onCloseYTSetup: () => void;
  onCloseMapPicker?: () => void;

  // Handlers — actions
  onSaveTrack: (track: Track | null, jamUrl?: string) => void;
  onSaveProfile: (data: Partial<UserProfile> & { jamUrl?: string }) => void;
  onGpsPickerConfirm: (coords: { lat: number; lng: number }) => void;
  onCameraCapture: (dataUrl: string) => void;
  onSpotifyShare: (track: Track) => void;
  onYouTubeShare: (track: Track) => void;
  onSendRating: (vibe: string, note: string, anon: boolean) => void;
  onUnblock: (id: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onChatUser: (user: NearbyUser) => void;
  onAcceptChat: () => void;
  onDeclineChat: () => void;
  onSendMessage: (toId: string, text: string) => void;
  onCloseChat: (id: string) => void;
  onOpenCamera: () => void;
  onRateUser: () => void;
  onTipUser: () => void;
  onSendDMFromProfile: () => void;
  onOpenProfileEditor: () => void;
  onLiveStart: (title: string, visibility: LiveVisibility) => void;
  onLiveUpdateVisibility: (title: string, pub: boolean) => void;
  onLiveStop: () => void;
  onLiveSendOffer: (viewerId: string, offer: RTCSessionDescriptionInit) => void;
  onLiveSendIce: (to: string, c: RTCIceCandidateInit) => void;
  onLiveAnswerReceived: (cb: (id: string, a: RTCSessionDescriptionInit) => void) => void;
  onLiveIceReceived: (cb: (id: string, c: RTCIceCandidateInit) => void) => void;
  onLiveViewerJoined: (cb: (id: string) => void) => void;
  onLiveViewerLeft: (cb: (id: string) => void) => void;
  onViewerJoinLive: (id: string) => void;
  onViewerLeaveLive: (id: string) => void;
  onViewerSendAnswer: (to: string, a: RTCSessionDescriptionInit) => void;
  onViewerSendIce: (to: string, c: RTCIceCandidateInit) => void;
  onViewerOfferReceived: (cb: (from: string, o: RTCSessionDescriptionInit) => void) => void;
  onViewerIceReceived: (cb: (from: string, c: RTCIceCandidateInit) => void) => void;
  onViewerLiveEnded: (cb: (id: string) => void) => void;
  onYTCreate: (videoId: string, title: string, vt: string) => void;
  onYTEnd: () => void;
  onYTSync: (state: string, t: number) => void;
  onYTGetHostId: () => string | null;
  onYTLeave: () => void;
  onYTStateUpdate: (cb: (s: 'playing'|'paused', t: number, ts: number) => void) => () => void;
  onYTSessionEnded: (cb: (id: string) => void) => () => void;
  onMapStyleSelect?: (s: MapStyleDef) => void;

  referralCode: string;
  spotifyLinked: boolean;
  youtubeLinked: boolean;
  setYoutubeLinked: (v: boolean) => void;
}

export default function ModalsLayer(p: Props) {
  const openConvs = [...p.conversations.values()];

  return (
    <>
      {p.showTrackInput && (
        <TrackInput currentTrack={p.myTrack} jamUrl={p.myJamUrl}
          onSave={p.onSaveTrack} onClose={p.onCloseTrackInput} accentColor={p.profile.color} />
      )}

      {p.showProfileEditor && (
        <ProfileEditor profile={p.profile} jamUrl={p.myJamUrl}
          onSave={p.onSaveProfile} onClose={p.onCloseProfileEditor} onOpenCamera={p.onOpenCamera} />
      )}

      {p.viewedProfile && (
        <ProfileModal user={p.viewedProfile}
          onClose={p.onCloseViewedProfile}
          onChat={p.onChatUser.bind(null, p.viewedProfile)}
          onRate={p.onRateUser}
          onTip={() => p.onTipUser()}
          canChat={p.viewedProfile.chatStatus !== 'dnd'}
          ratings={p.ratingsCache[p.viewedProfile.id]}
          myRating={p.myRatings[p.viewedProfile.id]} />
      )}

      {p.ratingTarget && (
        <RatingPicker user={p.ratingTarget}
          alreadyRated={p.myRatings[p.ratingTarget.id]}
          onSubmit={p.onSendRating}
          onClose={p.onCloseRating} />
      )}

      {p.donateTarget && (
        <DonateUser user={p.donateTarget} onClose={p.onCloseDonateUser} />
      )}

      {p.showDonateApp && <DonateApp onClose={p.onCloseDonateApp} />}

      {p.showGpsPicker && (
        <GpsPicker accentColor={p.profile.color}
          onConfirm={p.onGpsPickerConfirm} onClose={p.onCloseGpsPicker} />
      )}

      {p.showCamera && (
        <CameraCapture onCapture={p.onCameraCapture} onClose={p.onCloseCamera} />
      )}

      {p.showSpotifyConnect && (
        <SpotifyConnect currentTrack={p.myTrack}
          onShare={p.onSpotifyShare} onClose={p.onCloseSpotify} />
      )}

      {p.showYouTubeConnect && (
        <YouTubeConnect
          onShare={p.onYouTubeShare}
          onClose={() => { p.onCloseYouTube(); }} />
      )}

      {p.showSettings && p.session && (
        <SettingsPanel
          username={p.profile.username}
          email={p.session.email}
          referralCode={p.referralCode}
          blockedUsers={p.blockedUsers}
          onUnblock={p.onUnblock}
          onLogout={p.onLogout}
          onDeleteAccount={p.onDeleteAccount}
          onClose={p.onCloseSettings} />
      )}

      {/* Chat notification */}
      {p.incomingRequest && (
        <ChatNotification request={p.incomingRequest}
          onAccept={p.onAcceptChat} onDecline={p.onDeclineChat} />
      )}

      {/* Chat windows */}
      {openConvs.map((conv, i) => (
        <ChatWindow key={conv.peer.id} conv={conv}
          onSend={(text) => p.onSendMessage(conv.peer.id, text)}
          onClose={() => p.onCloseChat(conv.peer.id)}
          myColor={p.profile.color} index={i} />
      ))}

      {/* Live */}
      {p.showLiveSetup && !p.showLiveBroadcast && (
        <LiveSetupModal broadcasterId={p.onYTGetHostId() ?? 'preview'}
          onStart={p.onLiveStart} onClose={p.onCloseLiveSetup} />
      )}

      {p.showLiveBroadcast && (
        <LiveBroadcast profile={p.profile} viewers={p.liveViewers}
          initialTitle={p.liveSetupData?.title}
          initialVisibility={p.liveSetupData?.visibility}
          onStartLive={(title, vis) => p.onLiveStart(title, vis)}
          onUpdateLive={p.onLiveUpdateVisibility}
          onStopLive={p.onLiveStop}
          onSendOffer={p.onLiveSendOffer} onSendIce={p.onLiveSendIce}
          onAnswerReceived={p.onLiveAnswerReceived} onIceReceived={p.onLiveIceReceived}
          onViewerJoined={p.onLiveViewerJoined} onViewerLeft={p.onLiveViewerLeft} />
      )}

      {p.watchingLive && (
        <LiveViewer broadcaster={p.watchingLive as NearbyUser} myId="" profile={p.profile}
          onClose={p.onCloseWatchingLive}
          onSendDM={(user) => p.onChatUser(user)}
          onJoinLive={p.onViewerJoinLive} onLeaveLive={p.onViewerLeaveLive}
          onSendAnswer={p.onViewerSendAnswer} onSendIce={p.onViewerSendIce}
          onOfferReceived={p.onViewerOfferReceived} onIceReceived={p.onViewerIceReceived}
          onLiveEnded={p.onViewerLiveEnded} />
      )}

      {/* YouTube Sessions */}
      {p.showYTSetup && (
        <YouTubeSessionSetup onClose={p.onCloseYTSetup} onStart={p.onYTCreate} />
      )}

      {p.myYTSession && !p.joiningYT && (
        <YouTubeSessionHost
          videoId={p.myYTSession.videoId} sessionTitle={p.myYTSession.title}
          participants={p.myYTSession.participants}
          hostSocketId={p.onYTGetHostId() ?? 'host'}
          profile={p.profile}
          onSync={p.onYTSync} onEnd={p.onYTEnd} />
      )}

      {p.joiningYT && (
        <YouTubeSessionViewer
          host={p.joiningYT.host} videoId={p.joiningYT.session.videoId}
          sessionTitle={p.joiningYT.session.title}
          hostSocketId={p.joiningYT.host.id}
          profile={p.profile}
          initialTime={p.joiningYT.session.currentTime}
          initialState={p.joiningYT.session.state}
          onLeave={p.onYTLeave}
          onStateUpdate={p.onYTStateUpdate}
          onSessionEnded={p.onYTSessionEnded} />
      )}
    </>
  );
}
