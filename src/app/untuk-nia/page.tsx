import Clock from "./_components/Clock";
import ElapsedTime from "./_components/ElapsedTime";
import ImportantDates from "./_components/ImportantDates";
import EventPopup from "./_components/EventPopup";
import ScrollHint from "./_components/ScrollHint";

export default function UntukNiaPage() {
  return (
    <>
      <section className="relative flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center px-4 py-10">
        <div className="relative z-10 w-full flex items-center justify-center">
          <div className="nia-fade-in w-full flex flex-col items-center">
            <Clock />
          </div>
        </div>

        <ScrollHint />
        <EventPopup />
      </section>

      <section className="relative z-10 flex w-full flex-col items-center justify-center px-4 pb-10 pt-6">
        <div className="nia-fade-in w-full flex flex-col items-center">
          <ElapsedTime />
        </div>
      </section>

      <section className="relative z-10 flex w-full flex-col items-center justify-center px-4 pb-16 pt-6">
        <ImportantDates />
      </section>
    </>
  );
}
