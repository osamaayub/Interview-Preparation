import { getInterviewById } from "@/lib/actions/general.action";
import { getRandomInterviewCover } from "@/lib/utils";
import { redirect } from "next/navigation";
import Image from "next/image";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async ({ params }: RouteParams) => {
  const { interviewId } = await params;
  const user = await getCurrentUser();
  const interview = await getInterviewById(interviewId);
  const {
    role,
    type,
    techstack,
    questions,
    userId,
  } = interview as Interview;

  if (!interview) {
    redirect("/");
  }

  return (
    <>
      <div className="flex flex-row gap-4 justify-between">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalized">{role} Interview</h3>
            <DisplayTechIcons techstack={techstack} />
          </div>
          <p className="bg-dark-200 px-4 py-2 rounded-lg h-fit capitalized">
            {type}
          </p>
        </div>
      </div>
      <Agent 
        questions={questions} 
        userId={userId} 
        userName={user!.name} 
        interviewId={interviewId}
        type="interview"
      />
    </>
  );
};

export default Page;
