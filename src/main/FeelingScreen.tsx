import React from "react";
import { Thought } from "../thoughts";
import { ScreenProps } from "react-navigation";
import { Container, MediumHeader, GhostButton } from "../ui";
import Constants from "expo-constants";
import theme from "../theme";
import { StatusBar, Platform } from "react-native";
import * as stats from "../stats";
import { FINISHED_SCREEN, FOLLOW_UP_REQUEST_SCREEN } from "./screens";
import { get } from "lodash";
import { saveExercise, countThoughts } from "../thoughtstore";
import haptic from "../haptic";
import * as StoreReview from "react-native-store-review";

export default class FeelingScreen extends React.Component<
  ScreenProps,
  {
    thought?: Thought;
  }
> {
  static navigationOptions = {
    header: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      thought: undefined, // yes, really. Trust me this fixed a bug.
    };
  }

  componentDidMount() {
    this.props.navigation.addListener("willFocus", args => {
      const thought = get(args, "state.params.thought");
      this.setState({
        thought,
      });
    });

    this.props.navigation.addListener("didFocus", args => {
      const thought = get(args, "state.params.thought");
      this.setState({
        thought,
      });
    });
  }

  private saveCheckup = async (
    feeling: "better" | "worse" | "same"
  ): Promise<Thought> => {
    const thought = this.state.thought;
    thought.immediateCheckup = feeling;
    return saveExercise(this.state.thought);
  };

  onFeltBetter = async () => {
    haptic.selection();
    const thought = await this.saveCheckup("better");

    if (Platform.OS === "ios") {
      // We load this BEFORE navigating so there's no weird lag
      const numPreviousThoughts = await countThoughts();
      if (numPreviousThoughts > 3) {
        // tfw when your function calls are anime-weapon-size
        stats.userPromptedForReviewWhenRecordingPositiveThought();

        StoreReview.requestReview();
      }
    }

    stats.userFeltBetter();
    this.props.navigation.navigate(FINISHED_SCREEN, {
      thought,
    });
  };

  onFeltTheSame = async () => {
    haptic.selection();
    const thought = await this.saveCheckup("same");

    stats.userFeltTheSame();
    this.props.navigation.navigate(FOLLOW_UP_REQUEST_SCREEN, {
      thought,
    });
  };

  onFeltWorse = async () => {
    haptic.selection();
    const thought = await this.saveCheckup("worse");

    stats.userFeltWorse();
    this.props.navigation.navigate(FOLLOW_UP_REQUEST_SCREEN, {
      thought,
    });
  };

  render() {
    if (!this.state.thought) {
      return <Container />;
    }

    return (
      <Container
        style={{
          paddingTop: Constants.statusBarHeight + 24,
          backgroundColor: theme.lightOffwhite,
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar barStyle="dark-content" hidden={false} />
        <MediumHeader
          style={{
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          How are you feeling now?
        </MediumHeader>

        <GhostButton
          title="Better than before 👍"
          width={"100%"}
          borderColor={theme.lightGray}
          textColor={theme.darkText}
          style={{
            marginBottom: 12,
            backgroundColor: "white",
          }}
          onPress={this.onFeltBetter}
        />
        <GhostButton
          title="About the same 🤷‍"
          width={"100%"}
          borderColor={theme.lightGray}
          textColor={theme.darkText}
          style={{
            marginBottom: 12,
            backgroundColor: "white",
          }}
          onPress={this.onFeltTheSame}
        />
        <GhostButton
          title="Worse than before 👎"
          width={"100%"}
          borderColor={theme.lightGray}
          textColor={theme.darkText}
          style={{
            marginBottom: 12,
            backgroundColor: "white",
          }}
          onPress={this.onFeltWorse}
        />
      </Container>
    );
  }
}
