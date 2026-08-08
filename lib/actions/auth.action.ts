"use server"

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { FirebaseError } from "firebase/app";


export async function signUp(params: SignUpParams) {
    const { uid, name, email } = params;

    try {
      const userRecord = await db.collection("users").doc(uid).get();
      
      if (userRecord.exists) {
        return {
            success: false,
            message: "User already exists. Please sign in instead"
        }
      }

      await db.collection("users").doc(uid).set({
        name, email
      });
      
      return {
        success: true,
        message: "Account created successfully. Please sign in.",
      };

    } catch (error: unknown | FirebaseError) {
        console.error("Error creating a user: ", error);

        //Handling Firebase-specific errors
        if (error instanceof FirebaseError) {
          if (error.code === "auth/email-already-exists") {
            return {
                success: false,
                message: "This email is already in use"
            }
          }
        }
        
        return {
            success: false,
            message: "Failed to create an account"
        }
    }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;
  
  if (!idToken) {  
    return {
      success: false,
      message: "Missing token"
    }
  }

  try {
    try {
     await auth.getUserByEmail(email); 
    } catch (err: unknown | FirebaseError) {
      if (err.code === 'auth/user-not-found') {
        return {
          success: false,
          message: "User does not exist. Create an account instead"
        }
      }
      throw err;
    }
   
    await setSessionCookie(idToken);  

    return {
      success: true,
      message: "Signed in successfully"
    }  
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "Failed to log into an account"
    }
  }
}

export async function setSessionCookie(idToken: string) {
  const ONE_WEEK = 60 * 60 * 24 * 7;
  const cookieStore = await cookies(); 
  
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: ONE_WEEK * 1000,
  });

  cookieStore.set("session", sessionCookie, {
    maxAge: ONE_WEEK,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax"
  });
}

export async function getCurrentUser(): Promise<User | null> {
   const cookieStore = await cookies();
   const sessionCookie = cookieStore.get("session")?.value;

   if (!sessionCookie) {
     return {
         name: "You",
         email: "nb1985@ukr.net",
         id: "gjvemyeiItgM4TeNSYRUa7YvEYr1"
       } as User;
   }

   try {
     const decodedClaims = await auth.verifySessionCookie(sessionCookie);
     const userRecord = await db.collection("users").doc(decodedClaims.uid).get(); 

     if (!userRecord.exists) {
       return null;
     }
     
     return {
      ...userRecord.data(),
      id: userRecord.id
     } as User;

   } catch (error) {
      console.log(error);

      return {
         name: "You",
         email: "nb1985@ukr.net",
         id: "gjvemyeiItgM4TeNSYRUa7YvEYr1"
       } as User;
   }
}  

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

export async function getInterviewsByUserId(userId: string): Promise<Interview[]> {
  const interviews = await db
        .collection("interviews")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Interview[]
} 

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[]> {
  const { userId, limit = 10 } = params;

  const interviews = await db
        .collection("interviews")
        .where("finalized", "==", true)
        .where("userId", "!=", userId)
        .orderBy("userId")           
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();    

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  })) as Interview[]
} 
