"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import AuthPanel from "@/components/auth/AuthPanel";

import {
  isKanchhiAuthenticated,
  touchKanchhiSession,
} from "@/lib/kanchhiSecurity";


type AuthGateProps = {
  children: ReactNode;
};


export default function AuthGate({
  children,
}: AuthGateProps) {

  const [
    ready,
    setReady,
  ] = useState(false);


  const [
    authenticated,
    setAuthenticated,
  ] = useState(false);


  const checkAuthentication =
    useCallback(
      () => {

        const valid =
          isKanchhiAuthenticated();


        setAuthenticated(
          valid
        );


        setReady(
          true
        );


        if (valid) {

          touchKanchhiSession();

        }

      },
      []
    );


  useEffect(() => {

    checkAuthentication();


    const handleFocus =
      () => {

        checkAuthentication();

      };


    const handleAuthChanged =
      () => {

        checkAuthentication();

      };


    window.addEventListener(
      "focus",
      handleFocus
    );


    window.addEventListener(
      "kanchhi-auth-changed",
      handleAuthChanged
    );


    const interval =
      window.setInterval(
        checkAuthentication,
        30000
      );


    return () => {

      window.removeEventListener(
        "focus",
        handleFocus
      );


      window.removeEventListener(
        "kanchhi-auth-changed",
        handleAuthChanged
      );


      window.clearInterval(
        interval
      );

    };

  }, [
    checkAuthentication,
  ]);


  function handleAuthenticated() {

    checkAuthentication();

  }


  if (!ready) {

    return (
      <main className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[#07101d]
        text-white
      ">

        <div className="
          text-sm
          text-slate-500
        ">
          Securing KANCHHI...
        </div>

      </main>
    );

  }


  if (!authenticated) {

    return (
      <AuthPanel
        onAuthenticated={
          handleAuthenticated
        }
      />
    );

  }


  return (
    <>
      {children}
    </>
  );
}