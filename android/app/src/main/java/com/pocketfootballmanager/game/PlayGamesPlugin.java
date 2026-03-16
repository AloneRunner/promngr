package com.pocketfootballmanager.game;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.GamesSignInClient;
import com.google.android.gms.games.PlayGames;

@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {
    @PluginMethod
    public void isAuthenticated(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }

        GamesSignInClient gamesSignInClient = PlayGames.getGamesSignInClient(getActivity());
        gamesSignInClient.isAuthenticated().addOnCompleteListener(task -> {
            boolean authenticated = task.isSuccessful()
                    && task.getResult() != null
                    && task.getResult().isAuthenticated();

            JSObject result = new JSObject();
            result.put("authenticated", authenticated);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }

        GamesSignInClient gamesSignInClient = PlayGames.getGamesSignInClient(getActivity());
        gamesSignInClient.isAuthenticated().addOnCompleteListener(authTask -> {
            boolean alreadyAuthenticated = authTask.isSuccessful()
                    && authTask.getResult() != null
                    && authTask.getResult().isAuthenticated();

            if (alreadyAuthenticated) {
                JSObject result = new JSObject();
                result.put("authenticated", true);
                call.resolve(result);
                return;
            }

            gamesSignInClient.signIn().addOnCompleteListener(signInTask -> {
                boolean authenticated = signInTask.isSuccessful()
                        && signInTask.getResult() != null
                        && signInTask.getResult().isAuthenticated();

                JSObject result = new JSObject();
                result.put("authenticated", authenticated);

                if (authenticated) {
                    call.resolve(result);
                } else {
                    call.reject("Play Games sign-in failed");
                }
            });
        });
    }

    @PluginMethod
    public void unlockAchievement(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }

        String achievementId = call.getString("achievementId");
        if (achievementId == null || achievementId.trim().isEmpty()) {
            call.reject("achievementId is required");
            return;
        }

        try {
            PlayGames.getAchievementsClient(getActivity()).unlock(achievementId);
            JSObject result = new JSObject();
            result.put("unlocked", true);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Failed to unlock achievement", exception);
        }
    }

    @PluginMethod
    public void showAchievements(PluginCall call) {
        if (getActivity() == null) {
            call.reject("Activity unavailable");
            return;
        }

        PlayGames.getAchievementsClient(getActivity())
                .getAchievementsIntent()
                .addOnSuccessListener(intent -> {
                    getActivity().startActivity(intent);
                    call.resolve();
                })
                .addOnFailureListener(error -> call.reject("Failed to open achievements", error));
    }
}