import ActivityKit
import SwiftUI
import WidgetKit

@main
struct MoumouLiveActivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        MoumouLiveActivityWidget()
    }
}

@available(iOS 16.1, *)
struct MoumouLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MoumouLiveActivityAttributes.self) { context in
            MoumouLiveActivityCard(state: context.state)
                .activityBackgroundTint(Color.black.opacity(0.92))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    MoumouArtwork(url: context.state.artworkURL)
                        .frame(width: 42, height: 42)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.title)
                            .font(.headline)
                            .lineLimit(1)
                        Text(context.state.artist)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.lyric.isEmpty ? "Moumusic" : context.state.lyric)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.82))
                        .lineLimit(2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            } compactLeading: {
                MoumouArtwork(url: context.state.artworkURL)
                    .frame(width: 22, height: 22)
            } compactTrailing: {
                Image(systemName: context.state.isPlaying ? "waveform" : "pause.fill")
                    .foregroundStyle(.white)
            } minimal: {
                Image(systemName: "music.note")
                    .foregroundStyle(.white)
            }
        }
    }
}

@available(iOS 16.1, *)
private struct MoumouLiveActivityCard: View {
    let state: MoumouLiveActivityAttributes.ContentState

    var body: some View {
        HStack(spacing: 12) {
            MoumouArtwork(url: state.artworkURL)
                .frame(width: 48, height: 48)
            VStack(alignment: .leading, spacing: 3) {
                Text(state.title).font(.headline).lineLimit(1)
                Text(state.artist).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                Text(state.lyric.isEmpty ? "Moumusic" : state.lyric)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.8))
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            Image(systemName: state.isPlaying ? "waveform" : "pause.fill")
                .foregroundStyle(.white.opacity(0.8))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

@available(iOS 16.1, *)
private struct MoumouArtwork: View {
    let url: String

    var body: some View {
        AsyncImage(url: URL(string: url)) { phase in
            switch phase {
            case .success(let image): image.resizable().scaledToFill()
            default: Image(systemName: "music.note").resizable().scaledToFit().padding(10).foregroundStyle(.white.opacity(0.6))
            }
        }
        .background(Color.white.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}
